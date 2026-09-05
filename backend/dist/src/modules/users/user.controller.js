import { sendSuccess } from '../../utils/api-response.js';
import { userService } from './user.service.js';
export const createUser = async (req, res) => {
    const user = await userService.create(req.body);
    sendSuccess(res, 201, 'User created successfully', user);
};
export const getUser = async (req, res) => {
    const user = await userService.getById(req.params.id);
    sendSuccess(res, 200, 'User fetched successfully', user);
};
