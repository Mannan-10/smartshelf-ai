import { Module } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { PrismaModule } from "../prisma.module.js";
import { JwtModule } from "@nestjs/jwt";
import type { JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type { SignOptions } from "jsonwebtoken";

@Module({
    imports: [
        PrismaModule,
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: ( configService: ConfigService ): JwtModuleOptions => {
                const expiresIn = configService.get<SignOptions["expiresIn"]>('JWT_EXPIRES_IN') ?? '1d';

                return {
                    secret: configService.getOrThrow<string>('JWT_SECRET'),
                    signOptions: {
                        expiresIn,
                    },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})

export class AuthModule {}
