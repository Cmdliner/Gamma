import { type Request, type Response } from "express";
import { IRegisterUser } from "../types/User";
import { registerValidationSchema } from "../validations/auth.validation";
import { Types } from "mongoose";
import Settings from "../config/settings";
import EmailService from "../emails/email.service";
import PhoneNumber from "../user/phone_number.model";
import User from "../user/user.model";
import OTP from "./auth.model";
import generateOTP from "../lib/otp";
import jwt from "jsonwebtoken";

const { ACCESS_TOKEN_SECRET } = Settings;
class AuthController {

    private static async createToken(payload: Types.ObjectId, secret: string, expiry: string | number) {
        return jwt.sign({ id: payload }, secret, { expiresIn: expiry });
    }

    // Register 
    static async register(req: Request, res: Response) {
        try {
            const {
                firstname,
                lastname,
                dob, email,
                gender, referral_code,
                state_of_origin,
                phone_no_1, phone_no_2
            }: IRegisterUser = req.body;

            const registerInfo: Partial<IRegisterUser> = { firstname, lastname, dob, email, gender, state_of_origin };

            const { error } = registerValidationSchema.validate(registerInfo);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const emailTaken = await User.exists({ email });
            if (emailTaken) return res.status(422).json({ error: "Email taken!" });

            let referrer = null;
            if (referral_code) {
                referrer = await User.findOne({ referral_code });
                if (!referrer) {
                    return res.status(404).json({ error: "Invalid referral code!" });
                }
                registerInfo.referral_code = referral_code;
            }

            const user = new User(registerInfo);
            if (!user) return res.status(400).json({ error: "Error registering user" });

            // Check if there is a valid referrer and add new user to list of referrals if true
            if (referrer) {
                referrer.referrals.push(user._id);
                await referrer.save();
            }

            //! TODO => Validate phone no
            let phoneNumbers = await PhoneNumber.insertMany(
                [{ value: phone_no_1 }, { value: phone_no_2 }]
            );

            if (!phoneNumbers) {
                return res.status(400).json({ error: "Error adding phone numbers" });
            }
            phoneNumbers = phoneNumbers.flatMap(phoneNo => phoneNo._id) as any;
            user.phone_numbers = phoneNumbers as any;

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: "Error sending verification mail" });
            }
            const fullname = `${lastname} ${firstname}`;
            await EmailService.sendVerificationEmail(email, fullname, emailVToken.token!);

            const userToken = await AuthController.createToken(user._id, ACCESS_TOKEN_SECRET, "1h");
            req.unverified_user = { id: userToken };

            res.setHeader("UnverifiedUser", req.unverified_user.id);

            await emailVToken.save();
            await user.save();

            return res.status(201).json({ success: "User created successfully!", user });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error registering user" });
        }
    }

    // Resend verification email
    static async resendVerificationMail(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: "Email not found!" });

            // find and delete previous otp
            await OTP.findOneAndDelete({ kind: "verification", owner: user._id });

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: "Error sending verification mail" });
            }
            const fullname = `${user.firstname} ${user.lastname}`;
            await EmailService.sendVerificationEmail(email, fullname, emailVToken.token!);

            const userToken = await AuthController.createToken(user._id, ACCESS_TOKEN_SECRET, "1h");
            req.unverified_user = { id: userToken };

            res.setHeader("UnverifiedUser", req.unverified_user.id);

            await emailVToken.save();
            await user.save();

            return res.status(200).json({ success: "Verification email sent successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error sending verification email" });
        }
    }

    // Email verification
    static async verifyEmail() { }

    // Set password

    // kyc
    static async verifyBVN() { }

    // bank account details
    static async addBankDetails() { }
}

export default AuthController;