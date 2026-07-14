import { validationResult } from "express-validator";

const Validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = {};
        errors.array().map((err) => (error[err.param] = err.msg));
        return res.status(200).json({ 
            status: false,
            code: 422,
            message: "validation failed",
            data: error 
        });
    }
    next();
};



export default Validate;
