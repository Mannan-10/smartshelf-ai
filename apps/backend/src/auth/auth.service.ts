import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { Role } from '../common/enums/role.enum.js';
import { JwtPayload } from './jwt-payload.type.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const email = registerDto.email.toLowerCase();

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(registerDto.password, 10);
        const role = registerDto.role ?? Role.OWNER;

        // In a multi-tenant SaaS, registering as an OWNER automatically initializes a new Store
        let storeId: string;
        let storeName: string;

        if (role === Role.OWNER) {
            storeName = registerDto.storeName?.trim() || `${registerDto.name}'s Shop`;
            const store = await this.prisma.store.create({
                data: {
                    name: storeName,
                    contactEmail: email,
                },
            });
            storeId = store.id;
        } else {
            // For staff/admin registered without an existing store context, link to default or create one
            let defaultStore = await this.prisma.store.findFirst();
            if (!defaultStore) {
                defaultStore = await this.prisma.store.create({
                    data: {
                        name: 'SmartShelf Store',
                        contactEmail: email,
                    },
                });
            }
            storeId = defaultStore.id;
            storeName = defaultStore.name;
        }

        const user = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                email,
                passwordHash,
                role,
                storeId,
            },
            include: { store: true },
        });

        const accessToken = await this.generateToken({
            sub: user.id,
            email: user.email,
            role: user.role as Role,
            storeId: user.storeId,
            storeName: user.store?.name ?? storeName,
        });

        return {
            message: 'User registered successfully',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                storeId: user.storeId,
                storeName: user.store?.name ?? storeName,
            },
        };
    }

    async login(loginDto: LoginDto) {
        const email = loginDto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { store: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Handle legacy users without a store assigned
        let storeId = user.storeId;
        let storeName = user.store?.name;

        if (!storeId) {
            let defaultStore = await this.prisma.store.findFirst();
            if (!defaultStore) {
                defaultStore = await this.prisma.store.create({
                    data: {
                        name: 'SmartShelf Store',
                        contactEmail: user.email,
                    },
                });
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: { storeId: defaultStore.id },
            });
            storeId = defaultStore.id;
            storeName = defaultStore.name;
        }

        const accessToken = await this.generateToken({
            sub: user.id,
            email: user.email,
            role: user.role as Role,
            storeId,
            storeName,
        });

        return {
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                storeId,
                storeName,
            },
        };
    }

    private async generateToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload);
    }
}
