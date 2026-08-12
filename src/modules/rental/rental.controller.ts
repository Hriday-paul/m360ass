import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { RentalService } from "./rental.service";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";

const rentalService = new RentalService();

export class RentalController {


    bookRental = catchAsync(async (req: Request, res: Response) => {

        const result = await rentalService.bookRental(req.body, req.user);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Rental booking on process, you will receive an email once the booking is confirmed',
            data: result,
        });
    })

    rentals = catchAsync(async (req: Request, res: Response) => {

        const query = pick(req.query, ["search", "vehicle_id", "status", "start_date", "end_date"])
        const options = pick(req.query, PaginateOptions);

        const result = await rentalService.rentals(query, options);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Rentals retrieved successfully',
            data: result,
        });
    })

    getRentalById = catchAsync(async (req: Request, res: Response) => {

        const result = await rentalService.getRentalById(req.params.id);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Rental details retrieved successfully',
            data: result,
        });
    })

    deleteRentalById = catchAsync(async (req: Request, res: Response) => {

        const result = await rentalService.deleteRentalById(req.params.id);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Rental deleted successfully',
            data: result,
        });
    })

    updateRentalById = catchAsync(async (req: Request, res: Response) => {

        const result = await rentalService.updateRentalById(req.params.id, req.body, req.user);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: result?.message || 'Rental updated successfully',
            // data: result,
        });
    })

    reportRentals = catchAsync(async (req: Request, res: Response) => {

        const query = pick(req.query, ["vehicle_id", "month"])

        const result = await rentalService.reportRentals(query);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Rental report generated successfully',
            data: result,
        });
    })

}