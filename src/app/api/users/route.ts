export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { UserService } from '@/lib/userService';
import type { User } from '@/lib/types';

// GET all users
export async function GET(request: NextRequest) {
  try {
    const users = await UserService.getAllUsers();
    // Strip passwords before sending to client
    const usersWithoutPasswords = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hashed_or_plain, ...rest } = user;
      return rest;
    });
    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST a new user
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json() as Omit<User, 'id'>;

    if (!userData.username || !userData.password_hashed_or_plain || !userData.name || !userData.role) {
      return NextResponse.json({ error: 'Missing required user fields' }, { status: 400 });
    }
    
    // Check for existing user
    const existing = await UserService.getUserByUsername(userData.username);
    if (existing) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const userId = await UserService.createUser(userData);
    const newUser = await UserService.getUserById(userId);

    if (!newUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hashed_or_plain, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

// PUT (update) a user
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const userData = await request.json() as Partial<Omit<User, 'id'>>;
    await UserService.updateUser(userId, userData);
    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await UserService.deleteUser(userId);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
