import { Router } from "express";
import UserController from "./user.controller";

const user = Router();

user.get("/profile-info", UserController.getUserInfo);
user.get("/referral-code", UserController.getReferralToken);


export default user;