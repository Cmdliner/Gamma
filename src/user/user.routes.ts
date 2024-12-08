import { Router } from "express";
import UserController from "./user.controller";
import multer from "multer";

const upload = multer({storage: multer.memoryStorage()});
const user = Router();

user.get("/profile-info", UserController.getUserInfo);
user.get("/my-wallet", UserController.getWalletBalance);
user.get("/referrals", UserController.getReferredUsers);
user.get("/referral-code", UserController.getReferralToken);
user.put("/bank-details", UserController.editBankAccountDetails);
user.put("/info", UserController.updateInfo);
user.put("/display-picture", upload.single("display_pic"), UserController.updateDisplayPicture);


export default user;
