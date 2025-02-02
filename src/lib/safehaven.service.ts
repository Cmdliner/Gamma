import { cfg } from "../init";
import IUser from "../types/user.schema";


export class SafeHavenService {
    private static SAFE_HAVEN_BASE_ENDPOINT =
        cfg.NODE_ENV === "production" ? "https://api.sandbox.safehavenmfb.com" : "";

    private static async generateAuthToken(type: "access" | "refresh" = "access") {
        const AUTH_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/oauth2/token`;

        try {
            const res = await fetch(AUTH_ENDPOINT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    grant_type: type === "access" ? "client_credentials" : "refesh_token",
                    client_id: cfg.SAFE_HAVEN_CLIENT_ID,
                    client_assertion: cfg.SAFE_HAVEN_CLIENT_ASSERTION,
                    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                    refresh_token: cfg.SAFE_HAVEN_REFRESH_TOKEN
                }),
            });

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async createAccount(user: IUser) {
        const CREATE_ACCOUNT_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/accounts`;

        try {
            const { access_token } = await this.generateAuthToken("access");
            const res = await fetch(CREATE_ACCOUNT_ENDPOINT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                    ClientID: cfg.SAFE_HAVEN_IBS_CLIENT_ID, // ibs_client_id returned when you generate a token
                },
                body: JSON.stringify({
                    accountType: "Savings",
                    suffix: "Oyeah", // Suffix to be added to the account name
                    metadata: {
                        user_id: user.id,
                    }
                })
            });
            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async initiateVerification(user: IUser) {
        const INIT_VERIFICATION_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/identity/v2`;
        console.log({acc_no: user.bank_details?.account_no})

        try {
            const { access_token } = await this.generateAuthToken();
            const res = await fetch(INIT_VERIFICATION_ENDPOINT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                },
                body: JSON.stringify({
                    type: "BVN",
                    number: "22399690538", // !todo => replace with user's actual bvn
                    debitAccountNumber: "0100729966", // What's this?
                }),
            });

            const data = await res.json();
            if (data.statusCode >= 400 || data.data.status === "FAILED") {
                return { custom_error: true, message: data.message };
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async validateVerification() {
        const VALIDATION_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/identity/v2/validate`;

        try {
            const res = await fetch(VALIDATION_ENDPOINT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ClientID: "", // add client id
                    Authorization: `Bearer ${cfg.SAFE_HAVEN_AUTH_TOKEN}`,
                },
                body: JSON.stringify({
                    identityId: "", // _id from initial verification req
                    type: "BVN",
                    otp: "", // otp sent to user's phone no
                }),
            });

            const data = await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // Creates a static, virtual acc that doesn't expire (A wallet account)
    static async createSubAccount(user: IUser) {
        const SUB_ACC_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/accounts/v2/subaccount`;

        try {
            const {access_token } = await this.generateAuthToken();
            const res = await fetch(SUB_ACC_ENDPOINT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    phoneNumber: `+234${user.phone_numbers[0]}`, // +234(rest of phone no)
                    emailAddress: user.email,
                    externalReference: user.wallet, // Make it user wallet ID
                    identityType: "BVN",
                    // identityNumber: "", // Don't know what this is?
                    // identityId: "", // That gotten from verification endpoints
                    // autoSweep: "" // What's this? Not required though
                }),
            });

            const data = await res.json();

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async createVirtualAccount() {
        const CREATE_VIRTUAL_ACC_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/virtual-accounts`;

        try {
            const res = await fetch(CREATE_VIRTUAL_ACC_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ClientID: "", // add this
                    Authorization: `Bearer ${cfg.SAFE_HAVEN_AUTH_TOKEN}`,
                },
                body: JSON.stringify({
                    validFor: 0, // Account validity in seconds
                    callbackUrl: "", // use the oyeah url
                    amountControl: "Fixed", // What does this do ? Other opts => [Underpayment, Overpayment]
                    amount: 0, // AN integer amount expected
                    externalRefernce: "", // unique per acc no

                    settlementAccount: {
                        accountNumber: "", // Sub account destination,
                        bankCode: "", // Use safe haven bank code
                    },
                }),
            });
            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async getVirtualTxn(v_acc_id: string) {
        const GET_VIRTUAL_TXN_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/virtual-accounts/${v_acc_id}/transaction`;

        try {
            const res = await fetch(GET_VIRTUAL_TXN_ENDPOINT, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });
            const data = await res.json();

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async getVirtualAccTransferStatus() {
        const ACC_TRSF_STATUS_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/virtual-accounts/status`;

        try {
            const res = await fetch(ACC_TRSF_STATUS_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ClientID: "", // Add this
                    Authorization: `Bearer ${cfg.ACCESS_TOKEN_SECRET}`,
                },
                body: JSON.stringify({
                    sessionId: "",
                }),
            });

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }
}