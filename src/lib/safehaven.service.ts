import { cfg } from "../init";


export class SafeHavenService {

    static SAFE_HAVEN_BASE_ENDPOINT = cfg.NODE_ENV == "production" ? "https://api.sandbox.safehavenmfb.com" : "";

    static async generateAuthToken() {
        const AUTH_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/oauth2/token`;

        try {
            const res = await fetch(AUTH_ENDPOINT, { 
                method: "POST",
                headers: {
                    "grant_type": "client_credentials",
                    "client_id": "",
                    "client_assertion": "",
                    "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                }
            });

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async createAccount() {
        const CREATE_ACCOUNT_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/accounts`

        try {
            const res = await fetch(CREATE_ACCOUNT_ENDPOINT, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "ClientID":  "" // ins_client_id returned when you generate a token
                },
                body: JSON.stringify({
                    "accountType": "Savings",
                    "suffix": "" // Suffix to be added to the account name
                    // "metadata": {} // Extra metadata you can add
                })
            });

            const data =  await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async initiateVerification() {
        const INIT_VERIFICATION_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/identity/v2`;

        try {
            const res = await fetch(INIT_VERIFICATION_ENDPOINT, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "ClientID": "" // Add this
                },
                body: JSON.stringify({
                    type: "BVN",
                    number: "", // A no from somewhere
                    debitAccountNumber: "" // What's this?
                })
            });

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async validateVerification() {
        const VALIDATION_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/identity/v2/validate`;

        try {
            const res = await fetch("POST", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "ClientID": "", // add client id
                },
                body: JSON.stringify({
                    identityId: "", // _id from initial verification req
                    type: "BVN",
                    otp: "", // otp sent to user's phone no
                })
            })
        } catch (error) {
            
        }
    }

    // Creates a static, virtual acc that doesn't expire (A wallet account)
    static async createSubAccount() {
        const SUB_ACC_ENDPOINT = `${this.SAFE_HAVEN_BASE_ENDPOINT}/accounts/v2/subaccount`;

        try {
            const res = await fetch(SUB_ACC_ENDPOINT, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "ClientID": "", // add this
                },
                body: JSON.stringify({
                    phoneNumber: "", // +234(rest of phone no)
                    emailAddress: "",
                    externalReference: "", // Make it user wallet ID
                    identityType: "BVN",
                    identityNumber: "", // Don't know what this is?
                    identityId: "", // That gotten from verification endpoints
                    // autoSweep: "" // What's this? Not required though    
                })
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
                    "Accept": "application/json",
                    "ClientID": "" // add this
                },
                body: JSON.stringify({
                    validFor: 0, // Account validity in seconds
                    callbackUrl: "", // use the oyeah url
                    amountControl: "Fixed", // What does this do ? Other opts => [Underpayment, Overpayment]
                    amount: 0, // AN integer amount expected
                    externalRefernce: "", // unique per acc no

                    settlementAccount: {
                        accountNumber: "", // Sub account destination,
                        bankCode: "" // Use safe haven bank code
                    }
                })
            })
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
                    "Accept": "application/json"
                }
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
                    "Accept": "application/json",
                    "ClientID": "" // Add this
                },
                body: JSON.stringify({
                    sessionId: ""
                })
            });

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }


}