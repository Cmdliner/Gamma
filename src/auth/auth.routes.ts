import { Router } from "express";
import AuthController from "./auth.controller";

const auth = Router();

auth.post("/register", AuthController.register);
auth.post("/verification-mail", AuthController.resendVerificationMail);
auth.post("/verify", AuthController.verifyEmail);

export default auth;