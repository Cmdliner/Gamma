import axios, { AxiosRequestConfig } from "axios";
import { Fincra } from "fincra-node-sdk";
import IWallet from "../types/wallet.schema";
import IUser from "../types/user.schema";
import IProduct, { SponsorshipDuration } from "../types/product.schema";
import { decryptBvn } from "./main";
import { AdPayments } from "@/types/ad.enums";

class FincraService {

    private static FINCRA_BASE_URL = "https://sandboxapi.fincra.com";
    private static fincra = new Fincra(
        process.env.FINCRA_PUBLIC_KEY,
        process.env.FINCRA_SECRET_KEY,
        { sandbox: process.env.NODE_ENV === "PRODUCTION" ? false : true }
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

    static async collectPayment(product: IProduct, customer: IUser, ref: string, paymentMethod: string, bidPrice?: number) {
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
                    "amount": bidPrice ? bidPrice : product.price,
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

    static async withdrawFunds(user: IUser, ref: string, amount: number, bank_account: number) {
        // const OYEAH_CUT = 0.05 
        // const AMOUNT_TO_WITHDRAW = 
        //! TODO => REMOVE OYEAH CUT 
        try {
            const payoutUrl = `${FincraService.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": process.env.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            }
            const res = await axios.post(payoutUrl, {
                business: process.env.FINCRA_BUSINESS_ID,
                sourceCurrency: "NGN",
                destinationCurrency: "NGN",
                amount: amount,
                description: "Payment",
                customerReference: ref,
                beneficiary: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    type: "individual",
                    accountHolderName: `${user.first_name} ${user.last_name}`,
                    accountNumber: user.bank_details.account_no,
                    country: "NG",
                    bankCode: user.bank_details.bank_code,
                },
                sender: {
                    name: "Customer Name",
                    email: "customer@theirmail.com",
                },
                paymentDestination: "bank_account",
            }, { headers });

            return res.data;
        } catch (error) {
            throw error;
        }
    }

    static async withdrawRewards(user: IUser) {
        //! TODO => Implement payment with oyeah service cut
        try {
            
        } catch (error) {
            throw error;
        }
    }

    static async sponsorProduct(product: IProduct, owner: IUser, sponsorshipDuration: SponsorshipDuration, ref: string, paymentMethod: string) {
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
                    "amount": sponsorshipDuration == "1Week" ? AdPayments.weekly : AdPayments.monthly,
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
