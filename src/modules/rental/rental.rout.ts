import { Router } from "express";
import auth from "../../middleware/auth";
import { Role } from "../user/user.interface";
import req_validator from "../../middleware/req_validation";
import { rateLimiter } from "../../middleware/RateLimiter";
import { RentalController } from "./rental.controller";
import { createRentalValidation, rentalQueryValidator, reportRentalValidator, updateRentalValidator } from "./rental.validator";

const router = Router();
const rentalController = new RentalController();

router.post("/", rateLimiter(), auth(Role.STAFF), createRentalValidation, req_validator(), rentalController.bookRental);

router.get("/", rentalQueryValidator, req_validator(), auth(Role.STAFF), rentalController.rentals);

router.get("/reports", reportRentalValidator, req_validator(), auth(Role.STAFF), rentalController.reportRentals);

router.get("/:id", auth(Role.STAFF), rentalController.getRentalById);

router.put("/:id", rateLimiter(), updateRentalValidator, req_validator(), auth(Role.STAFF),
    rentalController.updateRentalById);

router.delete("/:id", rateLimiter(), auth(Role.STAFF), rentalController.deleteRentalById);

export const rentalRoutes = router;