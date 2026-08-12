import { Router } from "express";
import { changePasswordValidator, createAccountValidator, forgotPasswordValidator, loginAccountValidator, refreshTokenValidator, resetPasswordValidator } from "./auth.validator";
import req_validator from "../../middleware/req_validation";
import { otpResendValidator, otpVerifyValidator } from "../otp/otp.validation";
import auth from "../../middleware/auth";
import { rateLimit } from 'express-rate-limit';
import { AuthController } from "./auth.controller";
import { OtpController } from "../otp/otp.controller";
import { Role } from "../user/user.interface";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

const authController = new AuthController();
const otpController = new OtpController();

router.post('/create',
    rateLimiter(),
    createAccountValidator,
    req_validator(),
    authController.createUser
)

router.post('/login',
    rateLimiter(),
    loginAccountValidator,
    req_validator(),
    authController.loginUser
)

router.patch(
    '/change-password',
    rateLimiter(),
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
    rateLimiter({ windowMs: 1 * 60 * 1000, max: 2, msg: 'Only 2 request allowed per minutes. please try again after a minute' }),
    otpResendValidator,
    req_validator(),
    otpController.resendOtp,
);

router.post('/forgot-password',
    rateLimiter({ windowMs: 1 * 60 * 1000, max: 2, msg: 'Only 2 request allowed per minutes. please try again after a minute' }),
    forgotPasswordValidator, req_validator(), authController.forgotPassword);

router.patch('/reset-password',
    rateLimiter(),
    resetPasswordValidator, req_validator(), authController.resetPassword);

export const authRouts = router;