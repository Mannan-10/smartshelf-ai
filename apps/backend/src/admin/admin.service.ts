import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAdminOverview(storeId: string, user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const totalProducts = await this.prisma.product.count({
      where: { storeId, isArchived: false },
    });

    const products = await this.prisma.product.findMany({
      where: { storeId, isArchived: false },
      select: { stock: true, reorderLevel: true },
    });
    const lowStockItems = products.filter(
      (p) => p.stock <= p.reorderLevel,
    ).length;

    const expiryAlerts = await this.prisma.product.count({
      where: {
        storeId,
        isArchived: false,
        expiryDate: { lte: thirtyDaysFromNow, gte: today },
      },
    });

    const salesTodayList = await this.prisma.sale.findMany({
      where: { storeId, saleDate: { gte: today } },
      select: { totalAmount: true },
    });
    const totalSalesToday = salesTodayList.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );

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

  async getUsers(storeId: string) {
    return this.prisma.user.findMany({
      where: { storeId },
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

  async createUser(
    storeId: string,
    data: { email: string; password?: string; role: string; name?: string },
  ) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const password = data.password && data.password.trim() ? data.password.trim() : 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = data.name || email.split('@')[0];

    const user = await this.prisma.user.create({
      data: {
        storeId,
        email,
        name,
        passwordHash: hashedPassword,
        role: data.role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return {
      ...user,
      initialPassword: password,
    };
  }

  async updateUserPassword(storeId: string, id: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const userToUpdate = await this.prisma.user.findFirst({
      where: { id, storeId },
    });
    if (!userToUpdate) {
      throw new NotFoundException('User not found in this store');
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async deleteUser(storeId: string, id: string, currentUser: any) {
    if (id === currentUser.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const userToDelete = await this.prisma.user.findFirst({
      where: { id, storeId },
    });
    if (!userToDelete) {
      throw new NotFoundException('User not found in this store');
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

  async updateUserRole(storeId: string, id: string, newRole: string) {
    const userToUpdate = await this.prisma.user.findFirst({
      where: { id, storeId },
    });
    if (!userToUpdate) {
      throw new NotFoundException('User not found in this store');
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
        },
      });
      return updated;
    } catch (error: any) {
      throw error;
    }
  }
}
