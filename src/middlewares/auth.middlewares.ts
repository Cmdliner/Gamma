import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../user/user.model";
import { cfg } from "../init";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../lib/error.handler";

class AuthMiddleware {
    static async requireAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers?.authorization;
            if (!authHeader) throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized!");

            const [_, authToken] = authHeader.split(" ");

            const decoded = jwt.verify(authToken, cfg.ACCESS_TOKEN_SECRET) as JwtPayload;
            if (!decoded) throw new AppError(StatusCodes.FORBIDDEN, "Unauthorized!");

            const user = await User.findById(decoded.id).select(["-password"]);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND ,"User not found");

            // ensure user has passed onboarding stage and completed kyc process
            if (!user.email_verified || user.bvn?.verification_status !== "verified" || !user.bank_details) {
                throw new AppError(StatusCodes.FORBIDDEN, "Forbidden!");
            }
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            if ((error as Error).name === 'TokenExpiredError') {
                return res.status(StatusCodes.FORBIDDEN).json({ error: true, reason: "AUTH_TOKEN_EXPIRED" });
            }
            const [_, errResponse] = AppError.handle(error, "Malformed auth token");
            return res.status(StatusCodes.FORBIDDEN).json(errResponse);
        }
    }
}

export default AuthMiddleware;