import { Router } from "express";
import AuthController from "./auth.controller";

const auth = Router();

auth.post("/register", AuthController.register);
auth.post("/resend-verification-mail", AuthController.resendVerificationMail);
auth.post("/verify", AuthController.verifyEmail);
auth.post("/validate-bank-details", AuthController.validateBankDetails);
auth.post("/verify-bvn", AuthController.verifyBVN);
auth.post("/create-password", AuthController.setPassword);
auth.post("/forgot-password", AuthController.generatePasswordResetToken);
auth.post("/verify-reset-password", AuthController.verifyResetPwdOTP)
auth.post("/reset-password", AuthController.resetPassword);
auth.post("/login", AuthController.login);



export default auth;
