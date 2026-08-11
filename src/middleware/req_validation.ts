import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const req_validator = () => {
    return (req: Request, res: Response, next: NextFunction) => {

        const validatorRes = validationResult(req);
        if (!validatorRes.isEmpty()) {
            return res.status(400).send({
                message: "Validation failed",
                errors: validatorRes.array(),
            });
        }
        next();
    };
};

export default req_validator;

