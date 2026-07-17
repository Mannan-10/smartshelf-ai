import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
}
