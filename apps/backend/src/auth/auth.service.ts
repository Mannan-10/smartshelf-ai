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

        const user = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                email,
                passwordHash,
                role: registerDto.role ?? Role.OWNER,
            }
        });

        const accessToken = await this.generateToken({
            sub: user.id,
            email: user.email,
            role: user.role as Role,
        });

        return {
            message: 'User registered successfully',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    async login(loginDto: LoginDto) {
        const email = loginDto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const accessToken = await this.generateToken({
            sub: user.id,
            email: user.email,
            role: user.role as Role,
        });

        return {
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    private async generateToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload);
    }
}
