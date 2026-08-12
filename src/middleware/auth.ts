import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync';
import AppError from '../error/AppError';
import config from '../config/index';
import { Role, User } from '../modules/user/user.interface';
import db from '../db/knex';

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
        const isUserExist = await db<User>('users').where({ id: userId }).select("*").first();

        if (!isUserExist) {
            throw new AppError(httpStatus.NOT_FOUND, 'User not found');
        }

        if (!isUserExist?.isVerified) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not verified');
        }

        if (userRoles && !userRoles.includes(isUserExist?.role)) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
        }

        req.user = { id: userId, role, email: isUserExist?.email };

        next();
    });
};
export default auth;
