import { Request, RequestHandler, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { UserService } from "./user.service";

const userService = new UserService();

export class UserController {
    updateProfile = catchAsync(async (req: Request, res: Response) => {

        const result = await userService.updateProfile(req.body, req.user.id);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Profile updated successfully',
            data: result,
        });
    })

    //get my profile
    getMyProfile = catchAsync(async (req: Request, res: Response) => {
        const result = await userService.getUserById(req?.user?.id);
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'profile fetched successfully',
            data: result,
        });
    });

    // delete my accont
    deletemyAccount = catchAsync(async (req, res) => {

        const result = await userService.deleteAccountById(req.user.id);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Your account deleted successfully',
            data: result,
        });
    })

    deleteUser = catchAsync(async (req, res) => {

        const result = await userService.deleteAccountById(Number(req.params.id));

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'User account deleted successfully',
            data: result,
        });
    })

    userDetails = catchAsync(async (req, res) => {

        const result = await userService.getUserById(Number(req.params.id));

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'User details retrived successfully',
            data: result,
        });
    })

}