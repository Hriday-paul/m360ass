import { Request, Response } from "express";
import { AuthService } from "./auth.service"
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import catchAsync from "../../utils/catchAsync";
import { OtpService } from "../otp/otp.service";

const authService = new AuthService();
const otpService = new OtpService();

export class AuthController {
    //create user
    createUser = catchAsync(async (req: Request, res: Response) => {

        const user = await authService.createUser(req.body);

        // request to send otp
        const otptoken = await otpService.resendOtp(user?.email);


        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'user register successfully',
            data: { otpToken: otptoken },
        });
    })

    //login user
    loginUser = catchAsync(async (req: Request, res: Response) => {

        const result = await authService.loginUser(req.body);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Logged in successfully',
            data: result,
        });
    })

    // change password
    changePassword = catchAsync(async (req: Request, res: Response) => {
        const result = await authService.changePassword(req?.user?.id, req.body);
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Password changed successfully',
            data: result,
        });
    });

    // forgot password
    forgotPassword = catchAsync(async (req: Request, res: Response) => {
        const result = await authService.forgotPassword(req?.body?.email);
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'An OTP sent to your email',
            data: result,
        });
    });

    //reset password
    resetPassword = catchAsync(async (req: Request, res: Response) => {
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
    refreshToken = catchAsync(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Access token retrieved successfully',
            data: result,
        });
    });
}