import { VehicleService } from "./vehicle.service";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import config from "../../config";
import AppError from "../../error/AppError";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";

const vehicleService = new VehicleService();

export class VehicleController {

    addNewVehicle = catchAsync(async (req: Request, res: Response) => {

        const files = req.files as Express.Multer.File[];

        const images = files ? files.map((file) => ({
            base_url: config.SERVER_URL!,
            path: "/" + file.path
        })) : [];

        //validate minimum 1 image is required
        if (images.length === 0) {
            throw new AppError(httpStatus.BAD_REQUEST, "At least one image is required for the vehicle");
        }

        const result = await vehicleService.addNewVehicle(req.body, images);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'New vehicle added successfully',
            data: result,
        });
    })

    getAllVehicles = catchAsync(async (req: Request, res: Response) => {

        const query = pick(req.query, ["search", "category"])
        const options = pick(req.query, PaginateOptions);

        const result = await vehicleService.getAllVehicles(query, options);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Vehicles retrieved successfully',
            data: result,
        });
    })

    getVehicleById = catchAsync(async (req: Request, res: Response) => {

        const result = await vehicleService.getVehicleById(req.params.id);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Vehicle retrieved successfully',
            data: result,
        });
    })

    deleteVehicleById = catchAsync(async (req: Request, res: Response) => {

        const result = await vehicleService.deleteVehicleById(req.params.id);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Vehicle deleted successfully',
            data: result,
        });
    })

    updateVehicleById = catchAsync(async (req: Request, res: Response) => {

        const files = req.files as Express.Multer.File[];

        const images = files ? files.map((file) => ({
            base_url: config.SERVER_URL!,
            path: "/" + file.path
        })) : [];

        const result = await vehicleService.updateVehicleById(req.params.id, req.body, images);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Vehicle updated successfully',
            data: result,
        });
    })

    deleteVehiclePhotoById = catchAsync(async (req: Request, res: Response) => {

        const { photoId, vehicleId } = req.body;

        const result = await vehicleService.deleteVehiclePhotoById({ photoId, vehicleId });

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Vehicle photo deleted successfully',
            data: result,
        });
    })

}