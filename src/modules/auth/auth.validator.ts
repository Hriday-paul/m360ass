import { check } from 'express-validator';

export const createAccountValidator = [
    check('fname').trim().not().isEmpty().withMessage('First name is required').isString().withMessage('First name should be string'),

    check('phone').trim().optional().isMobilePhone("any").withMessage("Invalid Phone number"),

    check('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),

    check('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const addVendorAccountValidator = [
    check('fname').trim().not().isEmpty().withMessage('First name is required').isString().withMessage('First name should be string').isLength({ min: 1 }).withMessage('First name min length is 1'),

    check('phone').trim().optional().isMobilePhone("any").withMessage("Invalid Phone number"),

    check('email').optional({ checkFalsy: true }).trim().isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),

    check('address').optional().trim().isString(),

    check('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const loginAccountValidator = [
    check('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    check('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const social_loginAccountValidator = [
    check('idToken').trim().not().isEmpty().withMessage('Id token is required').isString(),
]

export const refreshTokenValidator = [
    check('refreshToken').trim().not().isEmpty().withMessage('refreshToken is required').isString(),
]

export const forgotPasswordValidator = [
    check('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]

export const resetPasswordValidator = [
    check('newPassword').trim().not().isEmpty().withMessage('newPassword is required'),
    check('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required'),
]

export const changePasswordValidator = [
    check('oldPassword').trim().not().isEmpty().withMessage('oldPassword is required').isString(),
    check('newPassword').trim().not().isEmpty().withMessage('newPassword is required').isString(),
    check('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required').isString(),
]