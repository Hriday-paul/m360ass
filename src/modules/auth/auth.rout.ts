import { Router } from "express";
import { changePasswordValidator, createAccountValidator, forgotPasswordValidator, loginAccountValidator, refreshTokenValidator, resetPasswordValidator } from "./auth.validator";
import req_validator from "../../middleware/req_validation";
import { otpResendValidator, otpVerifyValidator } from "../otp/otp.validation";
import auth from "../../middleware/auth";
import { document_Upload } from "../../utils/s3";
import parseData from "../../middleware/parseData";
import { rateLimit } from 'express-rate-limit';
import { AuthController } from "./auth.controller";
import { OtpController } from "../otp/otp.controller";
import { Role } from "../user/user.interface";

const router = Router();
const authController = new AuthController();
const otpController = new OtpController();

export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,                   // 5 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const error = new Error('Too many requests have been made. Please try again after a minute.') as any;
        error.statusCode = 429;
        error.isRateLimit = true;
        next(error);
    },
});

router.post('/create',
    apiLimiter,
    document_Upload.fields([
        { name: 'business_card_front' },
        { name: 'business_card_back' }
    ]),
    parseData(),
    createAccountValidator,
    req_validator(),
    authController.createUser
)

router.post('/login',
    apiLimiter,
    loginAccountValidator,
    req_validator(),
    authController.loginUser
)

router.patch(
    '/change-password',
    apiLimiter,
    changePasswordValidator,
    req_validator(),
    auth(Role.STAFF, Role.CUSTOMER),
    authController.changePassword,
);

router.post('/refresh',
    refreshTokenValidator,
    req_validator(),
    authController.refreshToken
)

router.post(
    '/verify-otp',
    otpVerifyValidator,
    req_validator(),
    otpController.verifyOtp,
);

router.post(
    '/resend-otp',
    rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minutes
        max: 2, // 1 requests per IP
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            const error = new Error('Only 2 request allowed per minutes. please try again after a minute') as any;
            error.statusCode = 429;
            error.isRateLimit = true;
            next(error);
        }
    }),
    otpResendValidator,
    req_validator(),
    otpController.resendOtp,
);

router.post('/forgot-password',
    rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minutes
        max: 2, // 1 requests per IP
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            const error = new Error('Only 2 request allowed per minutes. please try again after a minute') as any;
            error.statusCode = 429;
            error.isRateLimit = true;
            next(error);
        },
    }),
    forgotPasswordValidator, req_validator(), authController.forgotPassword);

router.patch('/reset-password',
    apiLimiter,
    resetPasswordValidator, req_validator(), authController.resetPassword);

export const authRouts = router;