import { Router } from "express";
import UserController from "../controllers/user.controller";
import multer from "multer";
import { UserAssetsUploadMiddleware, ValidateUserUploads } from "../middlewares/upload.middlewares";

const upload = multer({ storage: multer.memoryStorage() });
const user = Router();

user.get("/profile-info", UserController.getUserInfo);
user.get("/my-wallet", UserController.getWalletBalance);
user.get("/referral-info", UserController.getReferralInfo);
user.get("/report-abuse", upload.array("screenshots", 10), UserController.reportAbuse);
user.patch("/bank-details", UserController.editBankAccountDetails);
user.patch("/push-token", UserController.updateUsersDevicePushToken);
user.patch("/info", UserAssetsUploadMiddleware, ValidateUserUploads, UserController.updateInfo);
user.put("/display-picture", upload.single("display_pic"), UserController.updateDisplayPicture);

export default user;