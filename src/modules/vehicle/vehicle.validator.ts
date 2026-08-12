import { check } from "express-validator";

export const addVehicleValidator = [
    check("name")
        .not().isEmpty().withMessage("Vehicle name is required")
        .isString().withMessage("Vehicle name must be a string"),

    check("plate_number")
        .not().isEmpty().withMessage("Plate number is required")
        .isString().withMessage("Plate number must be a string"),

    check("category")
        .not().isEmpty().withMessage("Vehicle category is required")
        .isIn(["car", "truck", "bus", "motorcycle"]).withMessage("Invalid vehicle category"),

    check("daily_rate")
        .not().isEmpty().withMessage("Daily rate is required")
        .isFloat({ min: 0 }).withMessage("Daily rate must be a positive number").toFloat(),
]

export const updateVehicleValidator = [
    check("name")
        .optional()
        .isString().withMessage("Vehicle name must be a string"),

    check("category")
        .optional()
        .isIn(["car", "truck", "bus", "motorcycle"]).withMessage("Invalid vehicle category"),

    check("daily_rate")
        .optional()
        .isFloat({ min: 0 }).withMessage("Daily rate must be a positive number").toFloat(),
]

export const deleteVehiclePhotoValidator = [
    check("photoId")
        .not().isEmpty().withMessage("Photo ID is required")
        .isInt({ min: 1 }).withMessage("Photo ID must be a positive integer").toInt(),

    check("vehicleId")
        .not().isEmpty().withMessage("Vehicle ID is required")
        .isInt({ min: 1 }).withMessage("Vehicle ID must be a positive integer").toInt(),
]