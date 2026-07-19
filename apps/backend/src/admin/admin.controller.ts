import { Controller, Get, Post, Delete, Patch, Body, Param, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Role } from "../common/enums/role.enum.js";
import { AdminService } from "./admin.service.js";


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('overview')
    getAdminOverview(@Req() req: any) {
        return this.adminService.getAdminOverview(req.user);
    }

    @Get('users')
    getUsers() {
        return this.adminService.getUsers();
    }

    @Post('users')
    createUser(@Body() body: { email: string; password?: string; role: string }) {
        return this.adminService.createUser(body);
    }

    @Delete('users/:id')
    deleteUser(@Param('id') id: string, @Req() req: any) {
        return this.adminService.deleteUser(id, req.user);
    }

    @Patch('users/:id/role')
    updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
        return this.adminService.updateUserRole(id, body.role);
    }
}
