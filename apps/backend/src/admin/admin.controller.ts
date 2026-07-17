import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Role } from "../common/enums/role.enum.js";
import { AdminService } from "./admin.service.js";


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('overview')
    getAdminOverview(@Req() req: any) {
        return {
            message: 'Admin overview accessed successfully',
            user: req.user,
            permissions: {
                canManageProducts: true,
                canManageStaff: true, 
                canViewReports: true,
                canAccessAdminPanel: true,
            },
            stats: {
                totalProducts: 0,
                lowStockItems: 0,
                expiryAlerts: 0,
                totalSalesToday: 0,
            },
        };
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
}
