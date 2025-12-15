import { ExecuteBetDto } from "../models/executeBet.model";

const LIVE_API = import.meta.env.VITE_API_URL || "";
	
class LotteryService {
	// DRAWS
	async getDraws() {
		try {
			const res = await fetch(`${LIVE_API}/api/draws/get-draws`);
			const data = await res.json();

			return data;
		} catch (error) {
			return error;
		}
	}

	// BETS
	async getBets(draw_number: any) {
		try {
			const res = await fetch(`${LIVE_API}/api/bets/get-bets/${draw_number}`);
			const data = await res.json();

			return data;
		} catch (error) {
			return error;
		}
	}

	async executeBet(transactionData: ExecuteBetDto): Promise <{success: boolean, message: string}> {
		try {
			const response = await fetch(`${LIVE_API}/api/bets/execute`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(transactionData),
			});
			const data = await response.json()

			if (!response.ok) {
				return {success: false, message: data.error}
			}
			
			return {success: true, message: data}
			
		
		} catch (error) {
			return {success: false, message: `${error}`}
		}
	}

	async addBet(): Promise<{success: boolean, message: string}> {
		try {
			const response = await fetch(`${LIVE_API}/api/bets/add`, {
				method: "POST",
			});

			const data = await response.json()

			if (!response.ok) {
				throw new Error 
			}

			return {success: true, message: data};
		} catch (err) {
			return { success: false, message: `${err}`} 
		}
	}
}

const lotteryService = new LotteryService();
export default lotteryService;
