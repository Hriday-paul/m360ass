import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';

import sendResponse from '../../utils/sendResponse';
import { Request, Response } from 'express';
import { OtpService } from './otp.service';

const otpServices = new OtpService();

export class OtpController {
  verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const token = req?.headers?.authorization;
    const result = await otpServices.verifyOtp(token as string, req.body.otp);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'OTP verified successfully',
      data: result,
    });
  });

  resendOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await otpServices.resendOtp(req?.body?.phone);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'OTP sent successfully',
      data: result,
    });
  });
}
