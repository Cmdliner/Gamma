import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../lib/error.handler";
import User from "../models/user.model";
import { logger } from "../config/logger.config";
import Admin from "../models/admin.model";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

class AdminController {

    static async signup(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            // !todo => Validate req body

            const hashedPassword = await hash(password, 10);

            const admin = await Admin.create({ email, hashedPassword });

            const accessToken = sign({ id: admin._id }, process.env.ADMIN_SECRET, { expiresIn: "2h" });
            const refreshToken = sign({ id: admin._id }, process.env.ADMIN_SECRET, { expiresIn: "30d" });

            return res.status(StatusCodes.OK).json({ 
                success: true,
                access_token: accessToken,
                refresh_token: refreshToken,
                message: "Admin created!" 
            });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error creating admin");
            return res.status(status).json(errResponse);
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // !todo => Validate email and password

            const admin = await Admin.findOne({ email });
            if (!admin) throw new AppError(StatusCodes.NOT_FOUND, "Admin not found");

            const passwordsMatch = await compare(password, admin.password);
            if (!passwordsMatch) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password");

            const accessToken = sign({ id: admin._id }, process.env.ADMIN_SECRET, { expiresIn: "2h" });
            const refreshToken = sign({ id: admin._id }, process.env.ADMIN_SECRET, { expiresIn: "30d" });

            return res.status(StatusCodes.OK).json({ 
                success: true, 
                access_token: accessToken,
                refresh_token: refreshToken
             });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error logging in");
            return res.status(status).json(errResponse);
        }
    }

    static async suspendUser(req: Request, res: Response) {
        try {
            const { userID } = req.params;
            if (!req.admin) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

            const user = await User.findById(userID);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

            user.account_status = "suspended";
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured");
            return res.status(status).json(errResponse);
        }

    }
}
export default AdminController;