import { v4 as uuidV4 } from "uuid";
import User from "../models/user.model";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { cfg } from "../init";
import { GeospatialDataNigeria } from "../lib/location.data";
import { isValidState } from "../lib/utils";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../lib/error.handler";

export type DecodeTokenResponse = {
    error: boolean;
    reason?: "ONBOARDING_TOKEN_EXPIRED" | "MALFORMED_ONBOARDING_TOKEN";
    message?: string
    id?: string;
}

type LocationType = { type: "Point", human_readable: string, coordinates: [number, number] };

class AuthService {

    static async generateUniqueReferralCode(): Promise<string | null> {
        for (let limit = 0; limit < 5; limit++) {
            const referralCode = uuidV4().split("-")[0];
            let duplicateCodeFound = !!await User.exists({ referral_code: referralCode });
            if (!duplicateCodeFound) return referralCode;
        }
        return null;
    }

    static async resolveLocation(location: string): Promise<LocationType> {
        const DEFAULT_LOCATION = "lagos";

        const humanReadableLocation = location || DEFAULT_LOCATION;

        if (!isValidState(humanReadableLocation)) {
            throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid location format");
        }

        return {
            type: "Point",
            human_readable: humanReadableLocation,
            coordinates: [
                GeospatialDataNigeria[humanReadableLocation].lat,
                GeospatialDataNigeria[humanReadableLocation].long
            ]
        };
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