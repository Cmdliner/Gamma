import axios from "axios";
import { cfg } from "../init";

class PaystackService {

	private static async getBankCodes() {
		const headers = {
			"Authorization": `Bearer ${cfg.PAYSTACK_SECRET_KEY}`
		}
		await axios.get("", { headers })
	}

	static async validateAccountDetails(accountNo: string, bankCode: string): Promise<object | null> {
		const headers = {
			"Authorization": `Bearer ${cfg.PAYSTACK_SECRET_KEY}`
		}

		const ACCOUNT_RESOLVE_URL = `${cfg.PAYSTACK_URI}/bank/resolve?account_number=${accountNo}&bank_code=${bankCode}`;

		try {
			const res = await axios.get(ACCOUNT_RESOLVE_URL, { headers });
			if (res.data.status == true) {
				return res.data.data;
			}
		} catch (error) {
			console.log(error);
			throw error;
		}

		return null;
	}
}


export default PaystackService;

