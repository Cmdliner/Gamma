import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import verifyIdentityLimiter from "../middlewares/ratelimit.middleware";
import AuthMiddleware from "../middlewares/auth.middlewares";

const auth = Router();

auth.get("/bank-codes", AuthController.getBankCodes);
auth.post("/register", AuthController.register);
auth.post("/resend-verification-mail", AuthController.resendVerificationMail);
auth.post("/verify-email", AuthController.verifyEmail);
auth.post("/validate-bank-details", AuthController.validateBankDetails);
auth.post("/verify-identity", verifyIdentityLimiter, AuthController.verifyIdentity);
auth.post("/create-password", AuthController.setPassword);
auth.post("/forgot-password", AuthController.generatePasswordResetToken);
auth.post("/verify-reset-password", AuthController.verifyResetPwdOTP);
auth.post("/reset-password", AuthMiddleware.requireAuth, AuthController.resetPassword);
auth.post("/login", AuthController.login);
auth.post("/refresh", AuthController.refresh);



export default auth;
