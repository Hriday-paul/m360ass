import { body, check, param } from "express-validator";

export const statusUpdateValidator = [
    check('status').not().isEmpty().withMessage('status is required').isBoolean().withMessage("status must be boolean").toBoolean(),
]

export const rotateBusinessCardValidator = [
    check("rotate")
        .not().isEmpty().withMessage('Rotation angle is required')
        .isFloat({ min: 0, max: 360 }).withMessage("The rotation angle must be a numeric value between 0 and 360").toFloat(),

    check("cardId")
        .not().isEmpty().withMessage('Card ID is required')
        .isUUID().withMessage("Card ID must be a valid UUID"),
]

export const dltPersonalBusinessCardValidator = [
    check("cardId")
        .not().isEmpty().withMessage('Card ID is required')
        .isUUID().withMessage("Card ID must be a valid UUID"),
]