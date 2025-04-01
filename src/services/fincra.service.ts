import type IUser from "../types/user.schema";
import type IProduct from "../types/product.schema";
import { type SponsorshipDuration } from "../types/product.schema";
import { AdPayments } from "../types/ad.enums";
import { cfg } from "../init";

class FincraService {

    private static FINCRA_BASE_URL = "https://sandboxapi.fincra.com";

    static async resolveBvn(bvn: string, business: string) {
        try {
            const url = `${this.FINCRA_BASE_URL}/core/bvn-verification`;
            const headers = {
                "Content-Type": "application/json",
                "Accepts": "application/json",
                "api-key": cfg.FINCRA_SECRET_KEY
            }
            const res = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    bvn,
                    business
                })
            });
            const data = await res.json();
            return data
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async purchaseItem(product: IProduct, customer: IUser, ref: string, paymentMethod: string, bidPrice?: number) {
        try {
            const opts = {
                url: `${this.FINCRA_BASE_URL}/checkout/payments`,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": cfg.FINCRA_SECRET_KEY,
                    "x-pub-key": cfg.FINCRA_PUBLIC_KEY,
                },
                data: {
                    amount: bidPrice ? bidPrice : product.price,
                    currency: "NGN",
                    customer: {
                        name: `${customer.first_name} ${customer.last_name}`,
                        email: customer.email,
                        phoneNumber: customer.phone_numbers[0]
                    },
                    metadata: {
                        customer_id: customer.id,
                        product_id: product.id,
                        payment_for: "product_payment",
                        amount_expected: bidPrice ? bidPrice : product.price,
                    },
                    successMessage: "You have successfully intiated transfer",
                    paymentMethods: [paymentMethod],
                    settlementDestination: "wallet",
                    feeBearer: "customer",
                    reference: ref
                }
            }
            const res = await fetch(opts.url, {
                method: "POST",
                headers: opts.headers,
                body: JSON.stringify(opts.data)
            });
            const data = await res.json();

            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }


    static async withdrawFunds(user: IUser, ref: string, amount: number) {
        const OYEAH_CUT = (5 / 100) * amount;
        const PROCESSING_FEE = 200
        const AMOUNT_TO_WITHDRAW = amount - OYEAH_CUT - PROCESSING_FEE;
        try {
            const payoutUrl = `${this.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            }
            const res = await fetch(payoutUrl, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    business: cfg.FINCRA_BUSINESS_ID,
                    sourceCurrency: "NGN",
                    destinationCurrency: "NGN",
                    amount: `${AMOUNT_TO_WITHDRAW}`,
                    description: "Payment",
                    customerReference: ref,
                    beneficiary: {
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        type: "individual",
                        accountHolderName: `${user.first_name} ${user.last_name}`,
                        accountNumber: `${user.bank_details.account_no}`,
                        country: "NG",
                        bankCode: `${user.bank_details.bank_code}`,
                    },
                    sender: {
                        name: "Customer Name",
                        email: "customer@theirmail.com",
                    },
                    paymentDestination: "bank_account",
                })
            });
            const data = await res.json();

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async withdrawRewards(user: IUser, amount: number, ref: string) {
        try {
            const payoutUrl = `${this.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            }
            const res = await fetch(payoutUrl, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    business: cfg.FINCRA_BUSINESS_ID,
                    sourceCurrency: "NGN",
                    destinationCurrency: "NGN",
                    amount: `${amount}`,
                    description: "Payment",
                    customerReference: ref,
                    beneficiary: {
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        type: "individual",
                        accountHolderName: `${user.first_name} ${user.last_name}`,
                        accountNumber: user.bank_details.account_no.toString(),
                        country: "NG",
                        bankCode: user.bank_details.bank_code.toString(),
                    },
                    sender: {
                        name: "Oyeah Escrow",
                        email: "payments@oyeahescrow.com",
                    },
                    paymentDestination: "bank_account",
                })
            });

            const data = await res.json();

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async sponsorProduct(product: IProduct, owner: IUser, sponsorshipDuration: SponsorshipDuration, ref: string, paymentMethod: string) {
        try {
            const opts = {
                url: `${this.FINCRA_BASE_URL}/checkout/payments`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": cfg.FINCRA_SECRET_KEY,
                    "x-pub-key": cfg.FINCRA_PUBLIC_KEY,
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
                        "payment_for": "ad_sponsorship",
                        amount_expected: sponsorshipDuration == "1Week" ? AdPayments.weekly : AdPayments.monthly
                    },
                    "successMessage": "You have successfully intiated transfer",
                    "paymentMethods": [paymentMethod],
                    "settlementDestination": "wallet",
                    "feeBearer": "customer",
                    "reference": ref
                }
            }
            const res = await fetch(opts.url, {
                method: opts.method,
                headers: opts.headers,
                body: JSON.stringify(opts.data)
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async handleRefund(user: IUser, amount: number, ref: string) {
        try {
            const payoutUrl = `${this.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            };

            const refundData = {
                business: cfg.FINCRA_BUSINESS_ID,
                sourceCurrency: "NGN",
                destinationCurrency: "NGN",
                amount: `${amount}`,
                description: "Refund",
                customerReference: ref,
                beneficiary: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    type: "individual",
                    accountHolderName: `${user.first_name} ${user.last_name}`,
                    accountNumber: `${user.bank_details.account_no}`,
                    country: "NG",
                    bankCode: `${user.bank_details.bank_code}`,
                },
                sender: {
                    name: "Oyeah Escrow",
                    email: "refunds@oyeahescrow.com.ng",
                },
                paymentDestination: "bank_account",
            };
            const res = await fetch(payoutUrl, {
                method: 'POST',
                mode: 'cors',
                headers,
                body: JSON.stringify(refundData)
            });
            const result = await res.json();
            return result;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default FincraService;
