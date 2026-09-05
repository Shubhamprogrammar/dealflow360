import argon2 from 'argon2';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { UserModel } from '../users/user.model.js';
export const authService = {
    login: async (email, password) => {
        const user = await UserModel.findOne({ email }).select('+passwordHash').exec();
        if (!user || !(await argon2.verify(user.passwordHash, password)))
            throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        return {
            accessToken: signAccessToken({ sub: user._id.toString(), role: user.role }),
            refreshToken: signRefreshToken({ sub: user._id.toString(), role: user.role }),
        };
    },
    refresh: async (token) => {
        try {
            const payload = verifyRefreshToken(token);
            if (payload.type !== 'refresh')
                throw new Error('wrong token');
            return { accessToken: signAccessToken({ sub: payload.sub, role: payload.role }) };
        }
        catch {
            throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
        }
    },
};
