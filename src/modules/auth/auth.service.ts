import AppError from "../../error/AppError"
import httpStatus from 'http-status'
import bcrypt from 'bcrypt'
import { createToken, verifyToken } from "./auth.utils"
import config from "../../config"
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { generateOtp } from "../../utils/otpGenerator"
import moment from "moment"
import fs from 'fs';
import path from "path"
import { emailQueue } from "../../queues/email.queue"
import { Role, User } from "../user/user.interface"
import { UserService } from "../user/user.service"
import db from "../../db/knex"
import { OtpRequest } from "../otp/otp.interface"

const userService = new UserService();

export class AuthService {

    async createUser(req_body: User) {

        const user = await userService.createNewUser(req_body);

        return user;
    };

    // Login
    async loginUser(payload: { email: string, password: string }) {

        const user = await db<User>('users').where({ email: payload?.email }).select("*").first();

        if (!user) {
            // If user not found, throw error
            throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
        }

        else {

            if (!user?.isVerified) {
                throw new AppError(httpStatus.BAD_REQUEST, 'Your account is not verified');
            }

            // Handle verify password
            const passwordMatched = await bcrypt.compare(payload?.password + config.password_pepper, user?.password);

            if (!passwordMatched) {
                throw new AppError(httpStatus.BAD_REQUEST, 'Please check your credentials and try again');
            }

        }

        const jwtPayload: { userId: number; role: Role } = {
            userId: user?.id,
            role: user?.role
        };

        const userDoc = (user as any);
        delete userDoc.password;
        delete userDoc.isVerified;

        // Generate access and refresh tokens
        const accessToken = createToken(
            jwtPayload,
            config.jwt_access_secret as string,
            60 * 30 // 30 minutes
        );

        const refreshToken = createToken(
            jwtPayload,
            config.jwt_refresh_secret as string,
            60 * 60 * 24 * 7, // 7 days
        );

        return {
            user: userDoc,
            accessToken,
            refreshToken,
        };
    };

    // Change password
    async changePassword(currentUserId: number, payload: { oldPassword: string, newPassword: string, confirmPassword: string }) {

        const user = await db<User>('users').where({ id: currentUserId }).select("*").first();

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
        }

        const passwordMatched = await bcrypt.compare(payload?.oldPassword + config.password_pepper, user?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
        }
        if (payload?.newPassword !== payload?.confirmPassword) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'New password and confirm password do not match',
            );
        }

        // create new encrypted password
        const PEPPER = config.password_pepper;
        const hashedPassword = await bcrypt.hash(payload?.newPassword + PEPPER, 15);

        //save the new password to the database
        const result = await db<User>('users').where({ id: currentUserId }).update({
            password: hashedPassword
        });

        // send email notification to the user about the password change
        const emailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'password_change.html'
        );

        await emailQueue.add(
            "email",
            {
                to: user?.email,
                subject: "Your password has been reseted",
                html: fs
                    .readFileSync(emailPath, 'utf8')
            },
        )

        return result;
    };

    // Forgot password
    async forgotPassword(email: string) {
        const user = await db<User>('users').where({ email }).select("id", "email", "role").first();

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
        }

        const currentTime = new Date();
        const otp = generateOtp();
        const expiresAt = moment(currentTime).add(10, 'minute').toDate();

        //hash the otp code
        const hashedOtp = await bcrypt.hash(otp, 10);

        //create a new otp request
        const [requestedOtp] = await db<OtpRequest>('otp_requests').insert({
            code: hashedOtp,
            expiredAt: expiresAt,
            createdAt: currentTime,
            isVerified: false,
            type: "FORGOT_PASSWORD",
            userId: user?.id
        }).returning('id')

        const jwtPayload = {
            userId: user?.id,
            role: user?.role,
            requestId: requestedOtp?.id
        };

        //create a new token, for verify the otp request
        const token = jwt.sign(jwtPayload, config.jwt_auth_secret as Secret, {
            expiresIn: '10m',
        });

        //send the otp to the user email
        const otpEmailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'forgot_pass_mail.html'
        );

        // pass the email sending task to the email queue to be processed by the worker
        await emailQueue.add(
            "email",
            {
                to: user?.email,
                subject: "Your reset password OTP is",
                html: fs
                    .readFileSync(otpEmailPath, 'utf8')
                    .replace('{{otp}}', otp)
                    .replace('{{email}}', user?.email),
            },
        )


        return { email, token };
    };

    // Reset password
    async resetPassword(token: string, payload: { newPassword: string, confirmPassword: string }) {
        let decode;
        try {
            decode = jwt.verify(
                token,
                config.jwt_auth_secret as string,
            ) as JwtPayload;
        } catch (err) {
            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'Session has expired. Please try again',
            );
        }

        if (!decode?.requestId || !decode?.userId) {
            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'Invalid request',
            );
        }

        const user = await db<User>('users').where({ id: decode?.userId }).select("*").first();

        const OtpRequest = await db<OtpRequest>('otp_requests').where({ id: decode?.requestId }).select("*").first();

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
        }
        if (!OtpRequest) {
            throw new AppError(httpStatus.NOT_FOUND, 'Request does not exist');
        }
        if (OtpRequest?.type !== "FORGOT_PASSWORD") {
            throw new AppError(httpStatus.NOT_FOUND, 'Invalid request');
        }
        if (!OtpRequest?.isVerified) {
            throw new AppError(httpStatus.FORBIDDEN, 'OTP is not verified yet');
        }
        if (payload?.newPassword !== payload?.confirmPassword) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'New password and confirm password did not match',
            );
        }

        // creat encrypted password
        const PEPPER = config.password_pepper;
        const hashedPassword = await bcrypt.hash(payload?.newPassword + PEPPER, Number(config.bcrypt_salt_rounds));

        //save the new password to the database
        const result = await db<User>('users').where({ id: user?.id }).update({
            password: hashedPassword
        });

        // send email notification to the user about the password change
        const emailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'password_change.html'
        );

        await emailQueue.add(
            "email",
            {
                to: user?.email,
                subject: "Your password has been reseted",
                html: fs
                    .readFileSync(emailPath, 'utf8')
            },
        )

        return result;
    };


    // Refresh token
    async refreshToken (token: string) {
        // Checking if the given token is valid
        const decoded = verifyToken(token, config.jwt_refresh_secret as string);
        const { userId } = decoded;
        const user = await db<User>('users').where({ id: userId }).select("*").first();

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
        }

        if (!user?.isVerified) {
            throw new AppError(httpStatus.FORBIDDEN, 'This account is not verified');
        }

        const jwtPayload = {
            userId: user?.id,
            role: user?.role,
        };

        const accessToken = createToken(
            jwtPayload,
            config.jwt_access_secret as string,
            60 * 30, //30 minutes
        );

        const refreshToken = createToken(
            jwtPayload,
            config.jwt_refresh_secret as string,
            60 * 60 * 24 * 7, //7 days
        );

        return {
            accessToken,
            refreshToken
        };
    };

}