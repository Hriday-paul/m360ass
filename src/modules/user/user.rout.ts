import { Router } from "express";
import auth from "../../middleware/auth";
import { UserController } from "./user.controller";
import { Role } from "./user.interface";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

const userController = new UserController();

router.patch(
    '/update-my-profile',
    rateLimiter(),
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
    rateLimiter(),
    auth(Role.STAFF, Role.CUSTOMER),
    userController.deletemyAccount,
);

// router.delete(
//     '/delete-account/:id',
//     rateLimiter(),
//     auth(Role.ADMIN),
//     userController.deleteUser,
// );

export const userRoutes = router;