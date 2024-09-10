import { Router } from "express";
import AuthController from "./auth.controller";

const auth = Router();

auth.post("/register", AuthController.register);
auth.post("/verification-mail", AuthController.resendVerificationMail);
auth.post("/verify", AuthController.verifyEmail);
auth.post("/create-password", AuthController.setPassword);
auth.post("/forgot-password", AuthController.generatePasswordResetToken);
auth.post("/reset-password", AuthController.resetPassword);

export default auth;