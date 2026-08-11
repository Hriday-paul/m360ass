import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync';
import AppError from '../error/AppError';
import config from '../config/index';
import prisma from '../shared/prisma';
import { Role } from '../../generated/prisma/enums';

const auth = (...userRoles: Role[]) => {
    return catchAsync(async (req, res, next) => {

        const authHeader = req?.headers?.authorization;

        if (!authHeader) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

        let decode;
        try {
            decode = jwt.verify(
                token,
                config.jwt_access_secret as string,
            ) as JwtPayload;
        } catch (err) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'unauthorized');
        }
        const { role, userId } = decode;
        const isUserExist = await prisma.user.findFirst({ where: { id: userId }, include: { auth: true } });

        if (!isUserExist) {
            throw new AppError(httpStatus.NOT_FOUND, 'User not found');
        }

        if (!isUserExist?.auth?.isverified) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not verifiend');
        }

        if (isUserExist?.auth?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is deleted');
        }

        if (!isUserExist?.auth?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked');
        }

        if (userRoles && !userRoles.includes(isUserExist?.auth?.role)) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
        }

        req.user = { id: userId, role };

        next();
    });
};
export default auth;
