import { type Request, type Response, type NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../user/user.model";

class AuthMiddleware {
    static async requireAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers?.authorization;
            if (!authHeader) return res.status(401).json({ error: "Unauthorized!" });

            const [_, authToken] = authHeader.split(" ");

            const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET) as JwtPayload;
            if (!decoded) return res.status(403).json({ error: "Unauthorized!" });

            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ error: "User not found" });

            // ensure user has passed onboarding stage and completed kyc process
            if (!user.account_verified) {
                return res.status(403).json({ error: "Forbidden!" });
            }
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error ocuured while verifying authorization" });
        }
    }
}

export default AuthMiddleware;