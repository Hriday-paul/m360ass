import { Request, RequestHandler, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { uploadToS3 } from "../../utils/s3";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import AppError from "../../error/AppError";
import { scan_cardService } from "../scanCard/scan_card.service";
import { scan_cardControler } from "../scanCard/scan_card.controler";

//get all users
const all_users = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, ["searchTerm", "role"])
    const options = pick(req.query, PaginateOptions);
    const result = await userService.allUsers(query, options)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users retrive successfully',
        data: result,
    });
})

const updateProfile = catchAsync(async (req: Request, res: Response) => {

    let image: { key: string, url: string } | undefined;

    if (req.file) {
        image = await uploadToS3({
            file: req.file,
            fileName: `images/user/${Date.now()}-${Math.random()}-${req.file.originalname}`,
        });
    }

    const result = await userService.updateProfile(req.body, req.user.id, image ? image : undefined)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile updated successfully',
        data: result,
    });
})

const addNewMyBusinessCard = catchAsync(async (req: Request, res: Response) => {

    const body = await scan_cardControler.ScanCardFileUpload(req);

    const result = await scan_cardService.addNewBusinessCard(body, req.user?.id, true);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Businesss Card added successfully',
        data: result,
    });
})

//get my profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.getUserById(req?.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile fetched successfully',
        data: result,
    });
});

// status update user
const update_user_status: RequestHandler<{ id: string }, {}, { status: boolean }> = catchAsync(async (req, res) => {
    const result = await userService.status_update_user(req.body, req.params.id)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'status updated successfully',
        data: result,
    });
})

// delete my accont
const deletemyAccount = catchAsync(async (req, res) => {

    const result = await userService.deletemyAccount(req.user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Your account deleted successfully',
        data: result,
    });
})

const deleteUser = catchAsync(async (req, res) => {

    const result = await userService.deletemyAccount(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User account deleted successfully',
        data: result,
    });
})

const userDetails = catchAsync(async (req, res) => {

    const result = await userService.userDetails(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User details retrived successfully',
        data: result,
    });
})

const UpdateNotification = catchAsync(async (req, res) => {

    if (req?.body?.status && !req?.body?.fcmtoken) {
        throw new AppError(httpStatus.UNPROCESSABLE_ENTITY, "Fcm token required for unable notification")
    }

    const result = await userService.UpdateNotification(req?.body, req?.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Notification updated successfully',
        data: result,
    });
})

const getProfileCompletion = catchAsync(async (req, res) => {

    const result = await userService.getProfileCompletion(req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User profile completeion percent retrived successfully',
        data: result,
    });
})


const setDefaultPersonalBusinessCard = catchAsync(async (req, res) => {

    const result = await userService.setDefaultPersonalBusinessCard(req.body?.cardId, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Default business card set successfully',
        data: result,
    });
})




export const userController = {
    updateProfile,
    addNewMyBusinessCard,
    getMyProfile,
    update_user_status,
    all_users,
    deletemyAccount,
    deleteUser,
    userDetails,
    UpdateNotification,
    getProfileCompletion,

    setDefaultPersonalBusinessCard
}