import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const req_validator = () => {
    return (req: Request, res: Response, next: NextFunction) => {

        const validatorRes = validationResult(req);
        if (!validatorRes.isEmpty()) {
            return res.status(400).send({
                message: validatorRes.array()[0]?.msg || "Please fill all valid input",
                errors: validatorRes.array().map((error) => error?.msg)
            });
        }
        next();
    };
};

export default req_validator;

