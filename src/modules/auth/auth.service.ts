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
import generateRandomString from "../../utils/generateRandomString"
import { emailQueue } from "../../queues/email.queue"
import { User } from "../user/user.interface"
import { UserService } from "../user/user.service"

const userService = new UserService();

export class AuthService {
    
    async createUser(req_body: User) {

        const user = await userService.createNewUser(req_body);

        return user;
    };
}

// Login
const loginUser = async (payload: { email: string, password: string, fcmToken?: string }) => {

    const user = await prisma.user.findFirst({
        where: {
            email: payload?.email,
            isDeleted: false,
            auth: { role: { not: Role.ADMIN } }
        },
        include: { auth: true }
    });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
    }

    else {
        if (!user?.auth?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked');
        }

        if (user?.auth?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is deleted');
        }

        if (!user?.auth?.isverified) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Your account is not verified');
        }

        // Handle verify password
        // const passwordMatched = await bcrypt.compare(payload?.password, user?.auth?.password);
        const passwordMatched = await bcrypt.compare(payload?.password + config.password_pepper, user?.auth?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Please check your credentials and try again');
        }

        // Update FCM token if provided
        let updatedUser = user as User;
        if (payload?.fcmToken) {
            updatedUser = await prisma.user.update({
                where: { email: payload?.email },
                data: { fcmToken: payload.fcmToken },
            })
        }

    }

    //update last login time
    await prisma.auth.update({
        where: { userId: user?.id },
        data: { last_loginAt: new Date() },
    })

    const jwtPayload: { userId: string; role: Role } = {
        userId: user?.id,
        role: user?.auth?.role
    };

    const role = user?.auth?.role

    const userDoc = (user as any);
    delete userDoc.auth;

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
        user: { ...userDoc, role },
        accessToken,
        refreshToken,
    };
};

const socialLogin = async (payload: { idToken: string }) => {

    const idToken = payload?.idToken;

    const { name, email, picture, phone_number, ...more } = await firebaseAdmin.auth().verifyIdToken(idToken);

    if (!name || !email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Authentication failed");
    }

    let user = await prisma.user.findFirst({
        where: {
            email: email,
            isDeleted: false,
            auth: { role: { not: Role.ADMIN } }
        },
        include: { auth: true }
    });

    const sharableCard = {
        fullName: name,
        address: null,
        email,
        jobTitle: null,
        phoneNumber: phone_number
    }

    // if user does not exist on my db, create a new user
    if (!user) {
        // creat encrypted password
        const PEPPER = config.password_pepper;
        const hashedPassword = await bcrypt.hash(generateRandomString(10) + PEPPER, 15);

        const pic = picture ? { picture: { create: { url: picture, key: generateRandomString(8) } } } : {}

        user = await prisma.user.create({
            data: {
                email,
                fname: name,
                auth: {
                    create: {
                        isverified: true,
                        isSocialLogin: true,
                        email,
                        password: hashedPassword,
                    },
                },
                sharableCard: {
                    create: sharableCard
                },
                ...pic,
            },
            include: { auth: true }
        })

        //generate a default message template

        await prisma.msgTemplate.create({
            data: {
                label: "Greetings",
                message: `Hi <name>, Greetings! I’m ${user?.fname}. I got your contact information from Milo22 and wanted to reach out to connect. It would be great to stay in touch.`,
                userId: user?.id
            }
        })

    }
    // if user is exist but created by form
    else if (!user?.auth?.isSocialLogin) {
        // If user not found, throw error
        throw new AppError(httpStatus.FORBIDDEN, 'Your account is registered with email and password');
    } else {

        if (!user?.auth?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked');
        }

        if (user?.auth?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is deleted');
        }
    };

    const role = user?.auth?.role;

    const jwtPayload: { userId: string; role: Role } = {
        userId: user?.id,
        role: user?.auth?.role!
    };

    const userDoc = (user as any);
    delete userDoc.auth;

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 30, //30 minute
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 7, // 7 days
    );

    return {
        user: { ...userDoc, role },
        accessToken,
        refreshToken,
    };
};

//admin login
const adminLogin = async (payload: { email: string, password: string }) => {

    const user = await prisma.user.findFirst({ where: { email: payload?.email, isDeleted: false, auth: { role: Role.ADMIN } }, include: { auth: true } });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
    } else {

        if (!user?.auth?.isverified) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is not verified');
        }

        // Handle verify password
        const passwordMatched = await bcrypt.compare(payload?.password + config.password_pepper, user?.auth?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Please check your credentials and try again');
        }
    }

    await prisma.auth.update({
        where: { userId: user?.id },
        data: { last_loginAt: new Date() },
    })

    const userDoc = (user as any);
    delete userDoc.auth;


    const jwtPayload: { userId: string; role: Role } = {
        userId: user?.id,
        role: user?.auth?.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 30, //  30 days
    );

    return {
        user: userDoc,
        accessToken,
        refreshToken,
    };
};

// Change password
const changePassword = async (id: string, payload: { oldPassword: string, newPassword: string, confirmPassword: string }) => {

    const user = await prisma.user.findFirst({ where: { id }, include: { auth: true } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
    }

    const passwordMatched = await bcrypt.compare(payload?.oldPassword + config.password_pepper, user?.auth?.password as string);

    if (!passwordMatched) {
        throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
    }
    if (payload?.newPassword !== payload?.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'New password and confirm password do not match',
        );
    }

    // creat encrypted password
    const PEPPER = config.password_pepper;
    const hashedPassword = await bcrypt.hash(payload?.newPassword + PEPPER, 15);


    const result = await prisma.user.update({
        where: { id },
        data: {
            auth: {
                update: {
                    data: {
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                    }
                }
            }
        }
    }
    );

    const emailPath = path.join(
        process.cwd(),
        'public',
        'view',
        'password_change.html'
    );

    await emailQueue.add(
        "email",
        {
            to: user?.auth?.email,
            subject: "Your password has been reseted",
            html: fs
                .readFileSync(emailPath, 'utf8')
        },
    )

    return result;
};

// Forgot password
const forgotPassword = async (email: string) => {
    const user = await prisma.user.findFirst({ where: { email }, include: { auth: true } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
    }

    const currentTime = new Date();
    const otp = generateOtp();
    const expiresAt = moment(currentTime).add(10, 'minute').toDate();

    //hash the otp code
    const hashedOtp = await bcrypt.hash(otp, 10);

    //create a new otp request
    const requestedOtp = await prisma.otpRequest.create({
        data: {
            code: hashedOtp,
            expiredAt: expiresAt,
            createdAt: currentTime,
            isVerified: false,
            type: "FORGOT_PASSWORD",
            userId: user?.id
        }
    })

    const jwtPayload = {
        userId: user?.id,
        role: user?.auth?.role,
        requestId: requestedOtp?.id
    };

    const token = jwt.sign(jwtPayload, config.jwt_auth_secret as Secret, {
        expiresIn: '10m',
    });

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
const resetPassword = async (token: string, payload: { newPassword: string, confirmPassword: string }) => {
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

    const user = await prisma.user.findUnique({
        where: { id: decode?.userId }, select: {
            auth: true
        }
    })

    const OtpRequest = await prisma.otpRequest.findFirst({ where: { id: decode?.requestId } });

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
            'New password and confirm password do not match',
        );
    }

    // creat encrypted password
    const PEPPER = config.password_pepper;
    const hashedPassword = await bcrypt.hash(payload?.newPassword + PEPPER, Number(config.bcrypt_salt_rounds));

    const result = await prisma.user.update({
        where: { id: decode?.userId },
        data: {
            auth: {
                update: {
                    password: hashedPassword,
                    passwordChangedAt: new Date(),
                }
            }
        }
    });

    const emailPath = path.join(
        process.cwd(),
        'public',
        'view',
        'password_change.html'
    );

    await emailQueue.add(
        "email",
        {
            to: user?.auth?.email,
            subject: "Your password has been reseted",
            html: fs
                .readFileSync(emailPath, 'utf8')
        },
    )

    return result;
};


// Refresh token
const refreshToken = async (token: string) => {
    // Checking if the given token is valid
    const decoded = verifyToken(token, config.jwt_refresh_secret as string);
    const { userId } = decoded;
    const user = await prisma.user.findFirst({ where: { id: userId }, include: { auth: true } });

    if (!user || !user?.auth) {
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
    }
    const isDeleted = user?.auth?.isDeleted;

    if (isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, 'This account is deleted');
    }

    const jwtPayload = {
        userId: user?.id,
        role: user.auth?.role,
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


export const authService = {
    createUser,
    loginUser,
    socialLogin,
    forgotPassword,
    changePassword,
    resetPassword,
    refreshToken,
    adminLogin
}