import { Router } from "express";
import UserController from "./user.controller";

const user = Router();

user.get("/profile-info", UserController.getUserInfo);
user.get("/my-wallet", UserController.getWalletBalance);
user.get("/referrals", UserController.getReferredUsers)
user.get("/referral-code", UserController.getReferralToken);
user.put("/bank-account-details", UserController.editBankAccountDetails);


export default user;