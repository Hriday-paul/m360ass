import { Router } from "express";
import auth from "../../middleware/auth";
import { apiLimiter } from "../auth/auth.rout";
import { UserController } from "./user.controller";
import { Role } from "./user.interface";

const router = Router();

const userController = new UserController();

router.patch(
    '/update-my-profile',
    apiLimiter,
    auth(Role.STAFF, Role.CUSTOMER),
    userController.updateProfile,
);

router.get(
    '/my-profile',
    auth(Role.STAFF, Role.CUSTOMER),
    userController.getMyProfile,
);

router.get(
    '/:id',
    auth(Role.STAFF, Role.CUSTOMER),
    userController.userDetails,
);

router.delete(
    '/delete-account',
    apiLimiter,
    auth(Role.STAFF, Role.CUSTOMER),
    userController.deletemyAccount,
);

// router.delete(
//     '/delete-account/:id',
//     apiLimiter,
//     auth(Role.ADMIN),
//     userController.deleteUser,
// );

export const userRoutes = router;