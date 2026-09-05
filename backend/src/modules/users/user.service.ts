import argon2 from 'argon2';
import { ApiError } from '../../utils/api-error.js';
import { UserModel } from './user.model.js';
import type { UserDocument } from './user.model.js';
import type { CreateUserInput, UserView } from './user.types.js';
const view = (user: UserDocument & { _id: { toString(): string } }): UserView => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  team: user.team,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
export const userService = {
  create: async (input: CreateUserInput): Promise<UserView> => {
    if (await UserModel.findOne({ email: input.email }).exec())
      throw new ApiError(409, 'Email already exists', 'EMAIL_EXISTS');
    return view(
      await UserModel.create({ ...input, passwordHash: await argon2.hash(input.password) }),
    );
  },
  getById: async (id: string): Promise<UserView> => {
    const user = await UserModel.findById(id).exec();
    if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    return view(user);
  },
};
