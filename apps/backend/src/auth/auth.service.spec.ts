import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service.js';
import { Role } from '../common/enums/role.enum.js';
import { PrismaService } from '../prisma.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

type MockJwtService = {
  signAsync: jest.Mock;
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: MockPrismaService;
  let jwtService: MockJwtService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-access-token'),
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user, hash password, and return access token', async () => {
      const registerDto: RegisterDto = {
        name: 'Store Owner',
        email: 'OWNER@EXAMPLE.COM',
        password: 'Password123',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'user-1',
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await authService.register(registerDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'owner@example.com',
        },
      });

      expect(prisma.user.create).toHaveBeenCalledTimes(1);

      const createPayload = prisma.user.create.mock.calls[0][0];

      expect(createPayload.data.name).toBe('Store Owner');
      expect(createPayload.data.email).toBe('owner@example.com');
      expect(createPayload.data.role).toBe(Role.OWNER);
      expect(createPayload.data.passwordHash).not.toBe(registerDto.password);

      const passwordMatches = await bcrypt.compare(
        registerDto.password,
        createPayload.data.passwordHash,
      );

      expect(passwordMatches).toBe(true);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'owner@example.com',
        role: Role.OWNER,
      });

      expect(result).toEqual({
        message: 'User registered successfully',
        accessToken: 'mock-access-token',
        user: {
          id: 'user-1',
          name: 'Store Owner',
          email: 'owner@example.com',
          role: Role.OWNER,
        },
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto: RegisterDto = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'Password123',
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
      });

      await expect(authService.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should use provided role when role is passed in register dto', async () => {
      const registerDto: RegisterDto = {
        name: 'Staff User',
        email: 'staff@example.com',
        password: 'Password123',
        role: Role.STAFF,
      };

      prisma.user.findUnique.mockResolvedValue(null);

      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'staff-1',
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await authService.register(registerDto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: Role.STAFF,
        }),
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'staff-1',
        email: 'staff@example.com',
        role: Role.STAFF,
      });

      expect(result.user.role).toBe(Role.STAFF);
    });
  });

  describe('login', () => {
    it('should login valid user and return access token', async () => {
      const loginDto: LoginDto = {
        email: 'OWNER@EXAMPLE.COM',
        password: 'Password123',
      };

      const passwordHash = await bcrypt.hash(loginDto.password, 10);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Store Owner',
        email: 'owner@example.com',
        passwordHash,
        role: Role.OWNER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'owner@example.com',
        },
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'owner@example.com',
        role: Role.OWNER,
      });

      expect(result).toEqual({
        message: 'Login successful',
        accessToken: 'mock-access-token',
        user: {
          id: 'user-1',
          name: 'Store Owner',
          email: 'owner@example.com',
          role: Role.OWNER,
        },
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const loginDto: LoginDto = {
        email: 'missing@example.com',
        password: 'Password123',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'owner@example.com',
        password: 'WrongPassword',
      };

      const passwordHash = await bcrypt.hash('CorrectPassword123', 10);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Store Owner',
        email: 'owner@example.com',
        passwordHash,
        role: Role.OWNER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});