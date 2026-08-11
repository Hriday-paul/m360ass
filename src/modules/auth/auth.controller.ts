import { Request, Response } from "express";
import { AuthService } from "./auth.service"
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { otpServices } from "../otp/otp.service";
import catchAsync from "../../utils/catchAsync";
import { uploadToS3 } from "../../utils/s3";

const authService = new AuthService();

//create user
const createUser = catchAsync(async (req: Request, res: Response) => {

    const user = await authService.createUser(req.body);

    // request to send otp
    const otptoken = await otpServices.resendOtp(user?.email);


    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'user register successfully',
        data: { otpToken: otptoken },
    });
})

//login user
const loginUser = catchAsync(async (req: Request, res: Response) => {

    const result = await authService.loginUser(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logged in successfully',
        data: result,
    });
})

//social login
const socialLogin = catchAsync(async (req: Request, res: Response) => {

    const result = await authService.socialLogin(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logged in successfully',
        data: result,
    });
})

const adminLogin = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.adminLogin(req.body)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logged in successfully',
        data: result,
    });
})

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.changePassword(req?.user?.id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password changed successfully',
        data: result,
    });
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req?.body?.email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'An OTP sent to your email',
        data: result,
    });
});

//reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req?.headers?.authorization;
    const result = await authService.resetPassword(
        token as string,
        req?.body,
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset successfully',
        data: result,
    });
});


// refresh token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token retrieved successfully',
        data: result,
    });
});

export const authController = {
    createUser,
    loginUser,
    socialLogin,
    adminLogin,
    changePassword,
    resetPassword,
    forgotPassword,
    refreshToken
}