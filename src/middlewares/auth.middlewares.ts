import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../user/user.model";
import { cfg } from "../init";

class AuthMiddleware {
    static async requireAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers?.authorization;
            if (!authHeader) return res.status(401).json({ error: true, message: "Unauthorized!" });

            const [_, authToken] = authHeader.split(" ");

            const decoded = jwt.verify(authToken, cfg.ACCESS_TOKEN_SECRET) as JwtPayload;
            if (!decoded) return res.status(403).json({ error: true, message: "Unauthorized!" });

            const user = await User.findById(decoded.id).select(["-password"]);
            if (!user) return res.status(404).json({ error: true, message: "User not found" });

            // ensure user has passed onboarding stage and completed kyc process
            if (!user.email_verified || user.bvn?.verification_status !== "verified" || !user.bank_details) {
                return res.status(403).json({ error: true, message: "Forbidden!" });
            }
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            if ((error as Error).name === 'TokenExpiredError') {
                return res.status(403).json({ error: true, reason: "AUTH_TOKEN_EXPIRED" });
            }
            return res.status(403).json({ error: true, message: "An error occured while verifying authorization" });
        }
    }
}

export default AuthMiddleware;