import 'server-only';
import prisma from "./prisma";
import { type User } from "./types";

export const UserService = {
  async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role as User["role"],
      password_hashed_or_plain: u.password_hashed_or_plain || undefined,
    }));
  },

  async getUserById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u
      ? {
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role as User["role"],
          password_hashed_or_plain: u.password_hashed_or_plain || undefined,
        }
      : null;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { username } });
    return u
      ? {
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role as User["role"],
          password_hashed_or_plain: u.password_hashed_or_plain || undefined,
        }
      : null;
  },

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    const existing = await prisma.user.findUnique({ where: { username: userData.username } });
    if (existing) throw new Error("Username already exists.");
    const created = await prisma.user.create({
      data: {
        username: userData.username,
        name: userData.name,
        role: userData.role,
        password_hashed_or_plain: userData.password_hashed_or_plain ?? null,
      },
      select: { id: true },
    });
    return created.id;
  },

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        username: userData.username,
        name: userData.name,
        role: userData.role,
        password_hashed_or_plain: userData.password_hashed_or_plain,
      },
    });
  },
  
  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },
};
