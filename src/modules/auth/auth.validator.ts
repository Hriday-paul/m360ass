import { body } from 'express-validator';

export const createAccountValidator = [
    body('name').trim().not().isEmpty().withMessage('Name is required').isString().withMessage('Name should be string'),

    body('role').trim().not().isEmpty().withMessage('Role is required').isIn(['customer', 'staff']).withMessage('Role should be either customer or staff'),

    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),

    body('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const loginAccountValidator = [
    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    body('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const refreshTokenValidator = [
    body('refreshToken').trim().not().isEmpty().withMessage('refreshToken is required').isString(),
]

export const forgotPasswordValidator = [
    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]

export const resetPasswordValidator = [
    body('newPassword').trim().not().isEmpty().withMessage('newPassword is required'),
    body('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required'),
]

export const changePasswordValidator = [
    body('oldPassword').trim().not().isEmpty().withMessage('oldPassword is required').isString(),
    body('newPassword').trim().not().isEmpty().withMessage('newPassword is required').isString(),
    body('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required').isString(),
]