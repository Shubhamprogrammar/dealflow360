import { ApiError } from '../utils/api-error.js';
export const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
    });
    if (!result.success)
        return next(new ApiError(400, 'Request validation failed', 'VALIDATION_ERROR'));
    Object.assign(req, result.data);
    next();
};
