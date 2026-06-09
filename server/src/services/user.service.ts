import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import type { UserRole } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';

interface AdminUserListInput {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listAdminUsers(input: AdminUserListInput) {
  const filter: Record<string, unknown> = {};

  if (input.role) filter.role = input.role;
  if (input.isActive !== undefined) filter.isActive = input.isActive;
  if (input.search) {
    const pattern = new RegExp(escapeRegExp(input.search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const skip = (input.page - 1) * input.limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role avatar reportsCount reputation isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(input.limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function updateAdminUser(
  userId: string,
  input: { role?: UserRole; isActive?: boolean },
  currentUserId: string
) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest('Invalid user ID');
  }

  if (userId === currentUserId && input.isActive === false) {
    throw ApiError.badRequest('Admins cannot deactivate their own account');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    input,
    { new: true, runValidators: true }
  ).select('name email role avatar reportsCount reputation isActive createdAt');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}
