import { Router } from "express";
import auth from "../../middleware/auth";
import { userController } from "./user.controller";
import { dltPersonalBusinessCardValidator, rotateBusinessCardValidator, statusUpdateValidator } from "./user.validator";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import parseData from "../../middleware/parseData";
import { Role } from "../../../generated/prisma/enums";
import { apiLimiter } from "../auth/auth.rout";

const router = Router();

router.get(
    '/',
    auth(Role.ADMIN),
    userController.all_users,
);

router.patch(
    '/update-my-profile',
    apiLimiter,
    auth(Role.ADMIN, Role.USER),
    image_Upload.single('picture'),
    parseData(),
    userController.updateProfile,
);

router.post('/business-card',
    apiLimiter,
    image_Upload.fields([
        { name: 'card_front', maxCount: 1 },
        { name: 'card_back', maxCount: 1 }
    ]),
    parseData(),
    auth(Role.USER),
    userController.addNewMyBusinessCard
)

router.patch('/business-card/default',
    apiLimiter,
    dltPersonalBusinessCardValidator,
    req_validator(),
    auth(Role.USER),
    userController.setDefaultPersonalBusinessCard
);

router.patch(
    '/status/:id',
    statusUpdateValidator,
    req_validator(),
    auth(Role.ADMIN),
    userController.update_user_status,
);

router.patch(
    '/notification',
    statusUpdateValidator,
    req_validator(),
    auth(Role.ADMIN, Role.USER),
    userController.UpdateNotification,
);

router.get(
    '/my-profile',
    auth(Role.ADMIN, Role.USER),
    userController.getMyProfile,
);

router.get(
    '/my-profile/completion',
    auth(Role.USER),
    userController.getProfileCompletion,
);

router.get(
    '/:id',
    auth(Role.ADMIN, Role.USER),
    userController.userDetails,
);

router.delete(
    '/delete-account',
    apiLimiter,
    auth(Role.ADMIN, Role.USER),
    userController.deletemyAccount,
);

router.delete(
    '/delete-account/:id',
    apiLimiter,
    auth(Role.ADMIN),
    userController.deleteUser,
);

export const userRoutes = router;