import { Request, Response } from "express";
import { IRegisterUser } from "../types/User";
import User from "../user/user.model";
import { registerValidationSchema } from "../validations/auth.validation";

class AuthController {
    // Register
    static async register(req: Request, res: Response) {
        try {
            const { firstname, lastname, dob, email, gender, referral_code, state_of_origin }: IRegisterUser = req.body;

            const registerInfo: Partial<IRegisterUser> = { firstname, lastname, dob, email, gender, state_of_origin };
            
            const emailTaken = await User.exists({email});

            if(emailTaken) return res.status(422).json({ error: "Email taken!" });
            if (referral_code) {
                const referenceUser = await User.findOne({ referral_code });
                if (!referenceUser) {
                    return res.status(404).json({ error: "Invalid referral code!" });
                }
                registerInfo.referral_code = referral_code;
            }

            const { error } = registerValidationSchema.validate(registerInfo);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const user = await User.create(registerInfo);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error registering user" });
        }
    }



    // Email verification
    static async verifyEmail() { }

    // kyc
    static async verifyBVN() { }

    // bank account details
    static async bankDetails() { }
}

export default AuthController;