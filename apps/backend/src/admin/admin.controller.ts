import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Role } from "../common/enums/role.enum.js";


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
export class AdminController {
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
}
