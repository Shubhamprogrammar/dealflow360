import { UserModel } from './user.model.js';
export const userRepository = {
    findByEmail: (email) => UserModel.findOne({ email }).select('+passwordHash').exec(),
    findById: (id) => UserModel.findById(id).exec(),
    create: (input) => UserModel.create({ ...input, passwordHash: input.passwordHash }),
};
