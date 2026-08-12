import rateLimit from "express-rate-limit";

interface ApiLimiterOptions {
    windowMs?: number;
    max?: number;
    msg?: string;
}

export const rateLimiter = ({
    windowMs = 60 * 1000,
    max = 5,
    msg = 'Too many requests have been made. Please try again after a minute.',
}: ApiLimiterOptions = {}) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            const error = new Error(msg) as any;
            error.statusCode = 429;
            error.isRateLimit = true;
            next(error);
        },
    });
}