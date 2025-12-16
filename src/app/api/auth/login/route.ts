export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { UserService } from '@/lib/userService';
import prisma from '@/lib/prisma';
import type { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const uname = String(username || '').trim().toLowerCase();
    const pwd = String(password || '').trim();

    if (!uname || !pwd) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Hardcoded admin credentials
    if (uname === 'admin' && pwd === '123') {
      const adminUser: Omit<User, 'password_hashed_or_plain'> = {
        id: 'admin_special_user',
        username: 'admin',
        name: 'Administrator',
        role: 'admin',
      };
      return NextResponse.json(adminUser);
    }

    // Case-insensitive username lookup
    const user = await prisma.user.findFirst({
      where: { username: { equals: uname, mode: 'insensitive' } },
    });

    if (!user || String(user.password_hashed_or_plain ?? '') !== pwd) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hashed_or_plain, ...userWithoutPassword } = user as any;

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
