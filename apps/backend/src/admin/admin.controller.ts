import { Controller, Get, Post, Delete, Patch, Body, Param, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Role } from "../common/enums/role.enum.js";
import { AdminService } from "./admin.service.js";
import { CurrentStore } from "../common/decorators/current-store.decorator.js";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('overview')
    getAdminOverview(
        @CurrentStore() storeId: string,
        @Req() req: any,
    ) {
        return this.adminService.getAdminOverview(storeId, req.user);
    }

    @Get('users')
    getUsers(@CurrentStore() storeId: string) {
        return this.adminService.getUsers(storeId);
    }

    @Post('users')
    createUser(
        @CurrentStore() storeId: string,
        @Body() body: { email: string; password?: string; role: string },
    ) {
        return this.adminService.createUser(storeId, body);
    }

    @Delete('users/:id')
    deleteUser(
        @CurrentStore() storeId: string,
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.adminService.deleteUser(storeId, id, req.user);
    }

    @Patch('users/:id/role')
    updateUserRole(
        @CurrentStore() storeId: string,
        @Param('id') id: string,
        @Body() body: { role: string },
    ) {
        return this.adminService.updateUserRole(storeId, id, body.role);
    }
}
