import express, { NextFunction, Request, Response } from 'express';
import { authRouts } from './modules/auth/auth.rout';
import { userRoutes } from './modules/user/user.rout';
import { vehicleRoutes } from './modules/vehicle/vehicle.rout';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: authRouts,
    },
    {
        path: '/users',
        route: userRoutes,
    },
    {
        path: '/vehicles',
        route: vehicleRoutes,
    },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;