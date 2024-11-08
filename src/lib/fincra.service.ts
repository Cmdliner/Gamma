import axios, { AxiosRequestConfig } from "axios";
import { Fincra } from "fincra-node-sdk";
import IWallet from "../types/wallet.schema";
import IUser from "../types/user.schema";
import IProduct, { SponsorshipDuration } from "../types/product.schema";
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
            const url = `${this.FINCRA_BASE_URL}/profile/business/me`;
            const headers = {
                "api-key": process.env.FINCRA_SECRET_KEY,
                "Accept": "application/json",
                "Content-Type": "application/json"

            }
            // get request; ._id is business id
            const res = await axios.get(url, { headers });
            console.log({ business: res.data });

            return res.data;

        } catch (error) {
            console.error((error as Error).stack);
            throw error;
        }
    }

    static async resolveBvn(bvn: string, business: string) {
        try {
            const url = `${this.FINCRA_BASE_URL}/core/bvn-verification`;
            const headers = {
                "Content-Type": "application/json",
                "Accepts": "application/json",
                "api-key": process.env.FINCRA_SECRET_KEY
            }
            const res = await axios.post(url, {
                bvn,
                business
            }, { headers });
            return res.data
        } catch (error) {
            console.error(error);
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
                    merchantReference: user.id,
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


    static async collectPayment(product: IProduct, customer: IUser, ref: string, paymentMethod: string) {
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
                        "customer_id": customer.id,
                        "product_id": product.id,
                        "payment_for": "product_payment"
                    },
                    "successMessage": "You have successfully intiated transfer",
                    "paymentMethods": [paymentMethod],
                    "settlementDestination": "wallet",
                    "feeBearer": "customer",
                    "reference": ref
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
                url: `${FincraService.FINCRA_BASE_URL}/checkout/payments/merchant-reference/${ref}`,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": process.env.FINCRA_SECRET_KEY,
                    "x-business-id": process.env.FINCRA_BUSINESS_ID,
                }
            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            throw error;
        }
    }

    static async withdrawFunds(wallet: IWallet, bank_account: number) {
        // find the wallet account no and withdraw balance
        // parse the blance to an int
    }

    static async sponsorProduct(product: IProduct, owner: IUser, sponsorshipDuration: SponsorshipDuration, ref: string,  paymentMethod: string) {
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
                    "amount": sponsorshipDuration == "1Week" ? 7_000: 22_000,
                    "currency": "NGN",
                    "customer": {
                        "name": `${owner.first_name} ${owner.last_name}`,
                        "email": owner.email,
                        "phoneNumber": owner.phone_numbers[0]
                    },
                    metadata: {
                        "customer_id": owner.id,
                        "product_id": product.id,
                        "payment_for": "ad_sponsorship"
                    },
                    "successMessage": "You have successfully intiated transfer",
                    "paymentMethods": [paymentMethod],
                    "settlementDestination": "wallet",
                    "feeBearer": "customer",
                    "reference": ref
                }
            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
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


/* 
Fincra response
{
    "success": true,
    "message": "We use this to communicate information to you.",
    "data": {
        "status": "approved",
        "isActive": true,
        "accountNumber": "3992219528",
        "merchantReference": null,
        "KYCInformation": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "customer@theiremail.com"
        },
        "accountInformation": {
            "accountNumber": "3992219528",
            "accountName": "Customer's full name",
            "bankName": "GLOBUS BANK",
            "bankCode": "103"
        },
        "verifiedKYCData": null,
        "note": null,
        "accountOpeningFee": 0,
        "pendingAdditionalInfoCount": 0,
        "isPermanent": true,
        "expiresAt": null,
        "isCheckoutVa": false,
        "isBankTransferVa": false,
        "isSuspended": false,
        "reason": null,
        "monthlyVolume": null,
        "entityName": null,
        "paymentFlowDescription": null,
        "attachments": [],
        "meansOfId": [],
        "bankStatement": [],
        "utilityBill": [],
        "virtualAccountType": "additional",
        "riskRating": null,
        "checklist": null,
        "riskScreening": null,
        "channelKycUpdateStatus": null,
        "channelKycUpdateResponse": null,
        "_id": "************************",
        "business": "*******************",
        "currency": "NGN",
        "accountType": "individual",
        "entityType": "main_account",
        "currencyType": "fiat",
        "createdAt": "@timestamp",
        "updatedAt": "@timestamp"
    }
}

    
*/