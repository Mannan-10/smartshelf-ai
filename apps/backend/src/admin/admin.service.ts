import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAdminOverview(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const totalProducts = await this.prisma.product.count({ where: { isArchived: false } });
    
    const products = await this.prisma.product.findMany({
      where: { isArchived: false },
      select: { stock: true, reorderLevel: true }
    });
    const lowStockItems = products.filter(p => p.stock <= p.reorderLevel).length;

    const expiryAlerts = await this.prisma.product.count({
      where: {
        isArchived: false,
        expiryDate: { lte: thirtyDaysFromNow, gte: today }
      }
    });

    const salesTodayList = await this.prisma.sale.findMany({
      where: { saleDate: { gte: today } },
      select: { totalAmount: true }
    });
    const totalSalesToday = salesTodayList.reduce((sum, sale) => sum + sale.totalAmount, 0);

    return {
        message: 'Admin overview accessed successfully',
        user: user,
        permissions: {
            canManageProducts: true,
            canManageStaff: true, 
            canViewReports: true,
            canAccessAdminPanel: true,
        },
        stats: {
            totalProducts,
            lowStockItems,
            expiryAlerts,
            totalSalesToday,
        },
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: { email: string; password?: string; role: string; name?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const password = data.password || 'password123'; // Default password if none provided
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = data.name || data.email.split('@')[0];

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: name,
        passwordHash: hashedPassword,
        role: data.role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return user;
  }

  async deleteUser(id: string, currentUser: any) {
    if (id === currentUser.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const userToDelete = await this.prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      throw new NotFoundException('User not found');
    }

    if (userToDelete.role === Role.OWNER) {
      throw new ForbiddenException('Owner accounts cannot be deleted');
    }

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
  async updateUserRole(id: string, newRole: string) {
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: { role: newRole as any },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      });
      return updated;
    } catch (error: any) {
      throw error;
    }
  }
}
