import argon2 from 'argon2';
import { ApiError } from '../../utils/api-error.js';
import { UserModel } from './user.model.js';
const view = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
export const userService = {
    create: async (input) => {
        if (await UserModel.findOne({ email: input.email }).exec())
            throw new ApiError(409, 'Email already exists', 'EMAIL_EXISTS');
        return view(await UserModel.create({ ...input, passwordHash: await argon2.hash(input.password) }));
    },
    getById: async (id) => {
        const user = await UserModel.findById(id).exec();
        if (!user)
            throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
        return view(user);
    },
};
