import { v4 as uuidV4 } from "uuid";
import User from "../models/user.model";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { cfg } from "../init";

export type DecodeTokenResponse = {
    error: boolean;
    reason?: "ONBOARDING_TOKEN_EXPIRED" | "MALFORMED_ONBOARDING_TOKEN";
    message?: string
    id?: string;
}

class AuthService {

    static async generateUniqueReferralCode(): Promise<string | null> {
        for (let limit = 0; limit < 5; limit++) {
            const referralCode = uuidV4().split("-")[0];
            let duplicateCodeFound = !!await User.exists({ referral_code: referralCode });
            if (!duplicateCodeFound) return referralCode;
        }
        return null;
    }

    static async createToken(payload: Types.ObjectId, secret: string, expiry: string | number): Promise<string> {
        return jwt.sign({ id: payload }, secret, { expiresIn: expiry });
    }

    static decodeOnboardingToken(token: string): DecodeTokenResponse {
        try {
            const decodedToken = jwt.verify(token, cfg.ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return { error: true, message: "Error authenticating user!" };

            return { error: false, id: decodedToken.id }

        } catch (error) {
            if ((error as Error).name === 'TokenExpiredError') {
                return { error: true, reason: "ONBOARDING_TOKEN_EXPIRED" }
            }
            return { error: true, reason: "MALFORMED_ONBOARDING_TOKEN" }
        }
    }
}

export default AuthService;