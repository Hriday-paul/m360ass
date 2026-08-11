import { check, header } from "express-validator";

export const otpVerifyValidator = [
    // header('token').trim().not().isEmpty().withMessage('token is not found in header').isString(),
    check('otp').trim().not().isEmpty().withMessage('otp token is required').isString()
]

export const otpResendValidator = [
    check('phone').trim().not().isEmpty().isMobilePhone('any').withMessage('Invalid phone number'),
]