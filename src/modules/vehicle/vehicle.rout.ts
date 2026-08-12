import { Router } from "express";
import auth from "../../middleware/auth";
import { Role } from "../user/user.interface";
import { image_Upload } from "../../utils/FileUpload";
import parseData from "../../middleware/parseData";
import { addVehicleValidator, deleteVehiclePhotoValidator, updateVehicleValidator } from "./vehicle.validator";
import req_validator from "../../middleware/req_validation";
import { VehicleController } from "./vehicle.controller";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();
const vehicleController = new VehicleController();

router.post("/", rateLimiter(), auth(Role.STAFF), image_Upload.array('images'), parseData(), addVehicleValidator, req_validator(), vehicleController.addNewVehicle);

router.get("/", auth(Role.STAFF, Role.CUSTOMER), vehicleController.getAllVehicles);

router.get("/:id", auth(Role.STAFF, Role.CUSTOMER), vehicleController.getVehicleById);

router.put("/:id", rateLimiter(), auth(Role.STAFF), image_Upload.array('images'), parseData(), updateVehicleValidator, req_validator(), vehicleController.updateVehicleById);

router.delete("/photo", rateLimiter(), deleteVehiclePhotoValidator, req_validator(), auth(Role.STAFF), vehicleController.deleteVehiclePhotoById);

router.delete("/:id",  rateLimiter(), auth(Role.STAFF), vehicleController.deleteVehicleById);

export const vehicleRoutes = router;