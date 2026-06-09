import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { Role } from "../common/enums/role.enum.js";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    profile(@Req() req: any) {
        return {
            message: 'This is a protected route',
            user: req.user,
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.OWNER)
    @Get('owner-only')
    ownerOnly(@Req() req: any) {
        return {
            message: 'Only OWNER role can access this route',
            user: req.user,
        };
    }
}
