import * as ReferralCodes from "referral-codes";
import User from "../user/user.model";

class AuthService {
    
    static async generateUniqueReferralCode(): Promise<string | null> {
        let limit = 0;
        while (limit < 5) {
            const referralCode = ReferralCodes.generateOne({
                charset: "alphanumeric",
                pattern: "#-#-#-#-#-#-#",
                prefix: "",
                postfix: "",
            });
            let duplicateCodeFound = !!await User.exists({referral_code: referralCode});
            if(!duplicateCodeFound) return referralCode;
            limit++;
        }
        return null;
    }
}

export default AuthService;