import { body, query } from "express-validator";
import moment from "moment";

export const createRentalValidation = [
    body("vehicle_id")
        .notEmpty()
        .withMessage("Vehicle ID is required")
        .isInt({ min: 1 })
        .withMessage("Vehicle ID must be a valid integer").toInt(),

    body("customer_name")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Customer name must be between 2 and 100 characters"),

    body("customer_phone")
        .trim()
        .notEmpty()
        .withMessage("Customer phone is required")
        .isMobilePhone("any")
        .withMessage("Invalid phone number"),

    body("start_date")
        .notEmpty()
        .withMessage("Start date is required")
        .isISO8601({ strict: true })
        .withMessage("Start date must be a valid date (YYYY-MM-DD)"),

    body("end_date")
        .notEmpty()
        .withMessage("End date is required")
        .isISO8601({ strict: true })
        .withMessage("End date must be a valid date (YYYY-MM-DD)")
        .custom((endDate, { req }) => {
            if (moment(endDate).isBefore(moment(req.body.start_date), "day")) {
                throw new Error("End date cannot be before start date");
            }

            return true;
        }),
];

export const rentalQueryValidator = [
    query("vehicle_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Vehicle ID must be a valid integer"),

    query("status")
        .optional()
        .isIn(["booked", "ongoing", "completed", "cancelled"])
        .withMessage(
            "Status must be booked, ongoing, completed, or cancelled"
        ),

    query("start_date")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Start date must be a valid date (YYYY-MM-DD)"),

    query("end_date")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("End date must be a valid date (YYYY-MM-DD)")
        .custom((endDate, { req }) => {
            const startDate = (req.query as { start_date?: string }).start_date;

            if (
                startDate &&
                moment(endDate).isBefore(moment(startDate), "day")
            ) {
                throw new Error("End date cannot be before start date");
            }

            return true;
        }),
];

export const reportRentalValidator = [
    query("month")
        .notEmpty()
        .withMessage("Month is required")
        .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
        .withMessage("Month must be in YYYY-MM format"),

    query("vehicle_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Vehicle ID must be a valid integer"),
];

export const updateRentalValidator = [
    body("vehicle_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Vehicle ID must be a valid integer")
        .toInt(),

    body("customer_name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage(
            "Customer name must be between 2 and 100 characters"
        ),

    body("customer_phone")
        .optional()
        .trim()
        .isMobilePhone("any")
        .withMessage("Invalid phone number"),

    body("start_date")
        .optional()
        .isISO8601({ strict: true })
        .withMessage(
            "Start date must be a valid date (YYYY-MM-DD)"
        ),

    body("end_date")
        .optional()
        .isISO8601({ strict: true })
        .withMessage(
            "End date must be a valid date (YYYY-MM-DD)"
        )
        .custom((endDate, { req }) => {
            const startDate = req.body.start_date;

            if (
                startDate &&
                moment(endDate).isBefore(
                    moment(startDate),
                    "day"
                )
            ) {
                throw new Error(
                    "End date cannot be before start date"
                );
            }

            return true;
        }),

    body("status")
        .optional()
        .isIn([
            "booked",
            "ongoing",
            "completed",
            "cancelled",
        ])
        .withMessage(
            "Status must be booked, ongoing, completed, or cancelled"
        ),
];