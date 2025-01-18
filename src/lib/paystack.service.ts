import { cfg } from "../init";

class PaystackService {

	static async validateAccountDetails(accountNo: string, bankCode: string): Promise<object | null> {
		const headers = {
			"Authorization": `Bearer ${cfg.PAYSTACK_SECRET_KEY}`
		}

		const ACCOUNT_RESOLVE_URL = `${cfg.PAYSTACK_URI}/bank/resolve?account_number=${accountNo}&bank_code=${bankCode}`;

		try {
			const res = await fetch(ACCOUNT_RESOLVE_URL, {
				method: "GET",
				headers 
			});
			const data = await res.json();
			if (data.status == true) {
				return data.data;
			}
		} catch (error) {
			console.log(error);
			throw error;
		}

		return null;
	}
}


export default PaystackService;

