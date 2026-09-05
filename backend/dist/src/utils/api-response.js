export const sendSuccess = (res, statusCode, message, data, pagination) => res
    .status(statusCode)
    .json({ success: true, message, data, ...(pagination ? { pagination } : {}) });
