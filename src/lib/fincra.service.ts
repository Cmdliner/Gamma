import axios, { AxiosRequestConfig } from "axios";
import { Fincra } from "fincra-node-sdk";
import IWallet from "../types/wallet.schema";
import IUser from "../types/user.schema";
import IProduct from "../types/product.schema";
import crypto from "crypto";
import { decryptBvn } from "./main";

class FincraService {

    private static FINCRA_BASE_URL = "https://sandboxapi.fincra.com";
    private static fincra = new Fincra(
        process.env.FINCRA_PUBLIC_KEY,
        process.env.FINCRA_SECRET_KEY,
        { sandbox: process.env.NODE_ENV === "production" ? false : true }
    );

    static async getBusinessInfo() {
        try {
            const business = await FincraService.fincra.business.getBusinessId();
            return business;

        } catch (error) {
            console.error((error as Error).stack);
            throw error;
        }
    }

    static async createVirtualWallet(user: IUser) {
        try {
            const opts: AxiosRequestConfig = {
                url: `${FincraService.FINCRA_BASE_URL}/profile/virtual-accounts/requests`,
                method: "POST",
                headers: {
                    "api-key": process.env.FINCRA_SECRET_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                data: {
                    "currency": "NGN",
                    "accountType": "individual",
                    "KYCInformation": {
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "email": user.email,
                        "bvn": decryptBvn(user.bvn?.encrypted_data as string),
                    },
                    "channel": "wema"
                }

            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async collectPayment(product: IProduct, customer: IUser, ref: string) {
        try {
            const opts: AxiosRequestConfig = {
                url: `${FincraService.FINCRA_BASE_URL}/checkout/payments`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": process.env.FINCRA_SECRET_KEY,
                    "x-pub-key": process.env.FINCRA_PUBLIC_KEY,
                },
                data: {
                    "amount": product.price,
                    "currency": "NGN",
                    "customer": {
                        "name": `${customer.first_name} ${customer.last_name}`,
                        "email": customer.email,
                        "phoneNumber": customer.phone_numbers[0]
                    },
                    metadata: {
                        "user_id": customer.id,
                        "product_id": product.id
                    },
                    "successMessage": "You have successfully intiated transfer",
                    "paymentMethods": ["bank_transfer", "card"],
                    "settlementDestination": "wallet",
                    "feeBearer": "customer",
                    "reference": ref,
                    // "redirectUrl": "https://localhost:4001/payments/successful"
                }
            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async verifyPayment(ref: string) {
        try {
            const opts: AxiosRequestConfig = {
                method: "GET",
                url: `https://sandboxapi.fincra.com/checkout/payments/merchant-reference/${ref}`,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": process.env.FINCRA_SECRET_KEY,
                    // "x-business-id": process.env.FINCRA_PUBLIC_KEY,
                }
            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            throw error;
        }
    }

    static async validateWebhook(webhookSignature: string) {
        const encryptedData = crypto
            .createHmac("SHA512", "merchantWebhookSecretKey")
            .update(JSON.stringify("payload"))
            .digest("hex");
        const signatureFromWebhook = webhookSignature;

        if (encryptedData === signatureFromWebhook) {
            console.log("process");
        }
        else {
            console.log("discard");
        }

    }
    static async withdrawFunds(wallet: IWallet, bank_account: number) {
        // find the wallet account no and withdraw balance
        // parse the blance to an int
    }

    static async sponsorProduct() {
        try {
            const opts: AxiosRequestConfig = {};
            const res = await axios.request(opts);
        } catch (error) {
            //!TODO => Implement custom error calss that handles internally thrown errors
            throw {
                message: "An error occured",
                kind: "external_payment_error",
                ex_code: "EP001",
            };
        }
    }

    static async refundBalance() {
        try {
            const opts: AxiosRequestConfig = {};
            const res = await axios.request(opts);
        } catch (error) {
            //!TODO => Implement custom error calss that handles internally thrown errors
            throw {
                message: "An error occured",
                kind: "external_payment_error",
                ex_code: "EP001",
            };
        }
    }
}

export default FincraService;
