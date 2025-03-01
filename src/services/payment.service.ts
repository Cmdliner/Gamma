import { cfg } from "../init";
import { TokenManager } from "../lib/token_manager";
import IProduct from "../types/product.schema";
import { IRefundTransaction } from "../types/transaction.schema";
import IUser from "../types/user.schema";
import IWallet from "../types/wallet.schema";

type TAuthTokenParams = "access" | "refresh";
type TWithdrawalLocation = "wallet" | "rewards";
type TIdentityType = "BVN" | "NIN";
type CalculateCutReturnType = { total_fee: number, amount_to_withdraw: number }

export class PaymentService {

    /**
     * The payment service uses Safehaven API internally for all payment or bank transactions
     * 
     */
    private static SAFE_HAVEN_BASE_URI = cfg.NODE_ENV === "production" ? "https://api.sandbox.safehavenmfb.com" : "";
    private static SAFE_HAVEN_BANK_CODE = cfg.NODE_ENV === "production" ? "999240" : "999240";
    private static SAFE_HAVEN_CALLBACK_URL = `${cfg.OYEAH_SERVER_URL}/webhook`;

    static async generateSafehavenAuthToken(type: TAuthTokenParams = "access") {
        try {
            const url = `${this.SAFE_HAVEN_BASE_URI}/oauth2/token`;
            const options = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    grant_type: type === "access" ? "client_credentials" : "refesh_token",
                    client_id: cfg.SAFE_HAVEN_CLIENT_ID,
                    client_assertion: cfg.SAFE_HAVEN_CLIENT_ASSERTION,
                    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
                }),
            }

            const res = await fetch(url, options);
            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    private static async accountNameEnquiry(account_no: string, bank_code: string, access_token: string) {
        try {
            const url = `${this.SAFE_HAVEN_BASE_URI}/transfers/name-enquiry`;
            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    "Content-Type": 'application/json',
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    bankCode: bank_code,
                    accountNumber: account_no
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
            return data.data;

        } catch (error) {
            throw error;
        }
    }

    static calculateCutAndAmountToDisburse(amount: number): CalculateCutReturnType {
        const OYEAH_CUT = (5 / 100) * amount;
        const PROCESSING_FEE = 200;
        const TOTAL_FEE = OYEAH_CUT + PROCESSING_FEE;
        const AMOUNT_TO_WITHDRAW = amount - TOTAL_FEE;

        return { total_fee: TOTAL_FEE, amount_to_withdraw: AMOUNT_TO_WITHDRAW };
    }

    static async getBankList() {
        try {
            const access_token = await TokenManager.getToken();

            const url = `${this.SAFE_HAVEN_BASE_URI}/transfers/banks`;
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                }
            };

            const res = await fetch(url, options)
            const data = await res.json();
            if (data.statusCode >= 400) {
                return { error: true, message: "Error getting bank codes" };
            }

            return data.data;
        } catch (error) {
            throw error;
        }
    }

    static async verifyIdentity(identity_number: string, identity_type: TIdentityType = "BVN") {
        try {
            const url = `${this.SAFE_HAVEN_BASE_URI}/identity/v2`;
            const access_token  = await TokenManager.getToken();
            const options = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                },
                body: JSON.stringify({
                    type: identity_type,
                    number: identity_number,
                    debitAccountNumber: cfg.OYEAH_MAIN_ACCOUNT_SAFEHAVEN,
                }),
            };

            const res = await fetch(url, options);
            const data = await res.json();

            if (data.statusCode >= 400 || data.data.status === "FAILED") {
                return { identity_validation_error: true, error_message: data.message };
            }
            return { vId: data.data._id };

        } catch (error) {
            throw error;
        }
    }

    static async createUserWallet(user: IUser) {
        try {
            const access_token = await TokenManager.getToken();
            const url = `${this.SAFE_HAVEN_BASE_URI}/accounts/v2/subaccount`;
            const options = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    phoneNumber: `+234${user.phone_numbers[0]}`,
                    emailAddress: user.email,
                    identityType: "vID",
                    identityId: user.identity.v_id,
                    externalReference: `oyeah-user-wallet-${user.id}-${(new Date()).toISOString()}`
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
console.log({data});

            if (data.statusCode >= 400) return { wallet_creation_error: true, err_message: "Error creating wallet" };
            return { wallet_account: data.data.accountNumber };
        } catch (error) {
            throw error;
        }
    }

    static async generateProductPurchaseAccountDetails(amount: number, product: IProduct, transaction_id: string) {
        try {
            const access_token = await TokenManager.getToken();

            const url = `${this.SAFE_HAVEN_BASE_URI}/virtual-accounts`;
            const options: RequestInit = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    amountControl: "Fixed",
                    settlementAccount: {
                        accountNumber: cfg.OYEAH_ESCROW_ACCOUNT_SAFEHAVEN,
                        bankCode: this.SAFE_HAVEN_BANK_CODE
                    },
                    callbackUrl: `${this.SAFE_HAVEN_CALLBACK_URL}/product-purchase`,
                    validFor: 900,
                    amount,
                    externalReference: `${transaction_id}::${product.id}`
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
            if (data.statusCode >= 400 || data.data.status !== "Active") {
                return { payment_error: true, message: "Error generating payment account" }
            }
            return {
                account_number: data.data.accountNumber,
                account_name: data.data.accountName,
                amount_to_pay: data.data.amount,
                virtual_account_id: data.data._id
            }
        } catch (error) {
            throw error;
        }
    }

    static async generateSponsorshipPaymentAccountDetails(amount: number, product: IProduct, transaction_id: string) {
        try {
            const access_token = await TokenManager.getToken();

            const url = `${this.SAFE_HAVEN_BASE_URI}/virtual-accounts`;
            const options: RequestInit = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    amountControl: "Fixed",
                    settlementAccount: {
                        accountNumber: cfg.OYEAH_ADS_REVENUE_ACCOUNT_SAFEHAVEN,
                        bankCode: this.SAFE_HAVEN_BANK_CODE
                    },
                    callbackUrl: `${this.SAFE_HAVEN_CALLBACK_URL}/ad-payment`,
                    validFor: 900,
                    amount,
                    externalReference: `${transaction_id}::${product.id}`
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
            if (data.statusCode >= 400 || data.data.status !== "Active") {
                return { payment_error: true, message: "Error generating payment account" }
            }
            return {
                account_number: data.data.accountNumber,
                account_name: data.data.accountName,
                amount_to_pay: data.data.amount,
                virtual_account_id: data.data._id
            }
        } catch (error) {
            throw error;
        }
    }

    static async withdraw(from: TWithdrawalLocation, amount: number, user: IUser, wallet: IWallet, ref: string) {
        try {
            const { bank_details } = user;
            const access_token = await TokenManager.getToken();
            const { sessionId } = await this.accountNameEnquiry(
                bank_details.account_no,
                bank_details.bank_code,
                access_token
            );


            const url = `${this.SAFE_HAVEN_BASE_URI}/transfers`;
            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    nameEnquiryReference: sessionId,
                    debitAccountNumber: wallet.account.account_no,
                    beneficiaryBankCode: `${bank_details.bank_code}`,
                    beneficiaryAccountNumber: `${bank_details.account_no}`,
                    amount,
                    paymentReference: ref,
                    narration: from === "wallet" ? "Oyeah wallet payout" : "Oyeah rewards payout",
                    saveBeneficiary: false
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
            if (data.statusCode >= 400) {
                return { payout_error: true, message: "Withdrawal failed!" };
            }
            return data.data;
        } catch (error) {
            throw error;
        }
    }

    static async transfer(from: IWallet, to: IWallet, amount: number, ref: string) {
        try {

            const access_token = await TokenManager.getToken();
            const nameEnquiry = await this.accountNameEnquiry(
                to.account.account_no, // ! => this is a possible reason
                this.SAFE_HAVEN_BANK_CODE,
                access_token
            );

            const url = `${this.SAFE_HAVEN_BASE_URI}/transfers`;
            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    nameEnquiryReference: nameEnquiry.sessionId,
                    debitAccountNumber: cfg.OYEAH_ESCROW_ACCOUNT_SAFEHAVEN,
                    beneficiaryBankCode: `${this.SAFE_HAVEN_BANK_CODE}`,
                    beneficiaryAccountNumber: `${to.account.account_no}`,
                    amount,
                    paymentReference: `${from.id}::${to.id}::${ref}`,
                    narration: "Oyeah intra-wallet transfer",
                    saveBeneficiary: false
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
            if (data.statusCode >= 400) return { payout_error: true, message: "Wallet transfer failed!" };
            if (data.isReversed) {/* Add reversal reference */ }
            return data.data;
        } catch (error) {
            throw error;
        }
    }

    static async refund(to: IUser, tx: IRefundTransaction) {
        try {
            const { bank_details } = to;
            const access_token = await TokenManager.getToken();
            const { sessionId } = await this.accountNameEnquiry(
                bank_details.account_no,
                bank_details.bank_code,
                access_token
            );


            const url = `${this.SAFE_HAVEN_BASE_URI}/transfers`;
            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    nameEnquiryReference: sessionId,
                    debitAccountNumber: cfg.OYEAH_ESCROW_ACCOUNT_SAFEHAVEN,
                    beneficiaryBankCode: `${bank_details.bank_code}`,
                    beneficiaryAccountNumber: `${bank_details.account_no}`,
                    amount: tx.amount,
                    paymentReference: tx.id,
                    narration: "Payment refund",
                    saveBeneficiary: false
                })
            };

            const res = await fetch(url, options);
            const data = await res.json();
            if (data.statusCode >= 400) {
                return { payout_error: true, message: "Refund failed!" };
            }
            return data.data;
        } catch (error) {
            throw error;
        }
    }

    static async getVirtualTransactionStatus(v_account_id: string) {
        try {
            // ! Also dont froget to check for payment reversal
            //  and if so add the reversal_ref to trnsaction model
            // Get the _id from the create payment endpoint and use it to query
            const url = `${this.SAFE_HAVEN_BASE_URI}/virtual-accounts/virtualAccountId/transaction`;
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    ClientID: cfg.SAFE_HAVEN_CLIENT_ID,
                    Authorization: `Bearer `
                },
                body: JSON.stringify({ virtualAccountId: v_account_id })
            };

            const res = await fetch(url, options)
            const data = await res.json();
            console.log(data);
        } catch (error) {
            throw error;
        }
    }
}
