import { Router } from "express";
import UserController from "./user.controller";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const user = Router();

user.get("/profile-info", UserController.getUserInfo);
user.get("/my-wallet", UserController.getWalletBalance);
user.get("/rewards-history", UserController.getReferralHistory);
user.get("/referral-info", UserController.getReferralInfo);
user.put("/bank-details", UserController.editBankAccountDetails);
user.put("/push-token", UserController.updateUsersDevicePushToken);
user.put("/info", UserController.updateInfo);
user.put("/display-picture", upload.single("display_pic"), UserController.updateDisplayPicture);

export default user;
