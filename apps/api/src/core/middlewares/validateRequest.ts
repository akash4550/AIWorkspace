import { Request, Response, NextFunction } from "express";
import {ZodError, ZodType} from "zod";
import { AppError } from "../errors/AppError";



export const validateRequest = (schema: ZodType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({body:req.body,
                query:req.query,
                params:req.params
            });
            next();
        }catch(error){
            if ( error instanceof ZodError){
              const message=error.issues.map(issue=>issue.message).join(',');
              next(new AppError(`Validation failed: ${message}`,400));

            }else{
                next(error);
            }

        }
    };
};
