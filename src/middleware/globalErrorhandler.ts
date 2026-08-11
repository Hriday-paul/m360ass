/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { ErrorRequestHandler } from 'express';
import config from '../config';
import { TErrorSources } from '../interface/error';
import handleDuplicateError from '../error/DuplicateError';
import handleCastError from '../error/CastError';
import AppError from '../error/AppError';
import { MulterError } from 'multer';
import handelMulterError from '../error/MulterError';
import handleValidationError from '../error/ValidationError';
import { validationResult } from 'express-validator';
import handleRateLimitError from './RateLimitError';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {

  // eslint-disable-next-line no-console
  //setting default values
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  // Handle Express Validator Errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    statusCode = 400;
    message = 'Validation failed';
    errorSources = errors.array().map(error => ({
      path: error.type,
      message: error.msg,
    }));
  }

  if (err?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
  } else if (err instanceof MulterError) {
    const simplifiedError = handelMulterError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if ((err as any)?.isRateLimit === true || err?.statusCode === 429) {
    // ✅ Rate limit handler
    const simplifiedError = handleRateLimitError(err?.message);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  }
  else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
  }

  //ultimate return
  if (errorSources?.length !== 0) {
    errorSources = errorSources.map(source => {
      try {
        return {
          ...source,
          message: source?.message,
        };
      } catch (error) {
        return {
          ...source,
          message: source?.message,
        };
      }
    });
    // message = req.t(message);
  }
  try {
    res.status(statusCode).json({
      success: false,
      message: message,
      // message: message,
      errorSources: errorSources,
      err,
      // stack: config.NODE_ENV === 'development' ? err?.stack : null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    res.status(statusCode).json({
      success: false,
      // message: message? req.t(message) : null,
      message: message,
      errorSources,
      err,
      // stack: config.NODE_ENV === 'development' ? err?.stack : null,
    });
  }
};

export default globalErrorHandler;
