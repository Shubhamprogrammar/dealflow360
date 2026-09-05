export class ApiError extends Error {
    statusCode;
    code;
    isOperational = true;
    constructor(statusCode, message, code = 'API_ERROR') {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
    }
}
