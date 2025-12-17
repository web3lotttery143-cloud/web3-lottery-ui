import { ExecuteBetDto } from "../models/executeBet.model";

const LIVE_API = import.meta.env.VITE_API_URL || "";
	
class LotteryService {
	// LOTTERY SETUP
	async getLotterySetup (): Promise <{success: boolean, maximumBets?: string, message?: string}> {
		try {
			const res = await fetch(`${LIVE_API}/api/lottery/get-lottery-setup`)
			if(!res.ok){
				return {success: false, message: 'Failed to fetch lottery setup'}
			}

			const data = await res.json()
			return {success: true, maximumBets: data.Ok?.maximumBets}
		} catch (error) {
			return {success: false}
		}
	}
	// DRAWS
	async getDraws(): Promise<{success: boolean, jackpot?: string, winningNumber?: string, winners?: string[], bets?: any, message?: string}> {
    try {
        const res = await fetch(`${LIVE_API}/api/draws/get-draws`)

        if(!res.ok) {
            return {success: false, message: 'Something went wrong'}
        }
        const data = await res.json()
        const values = data.Ok?.[0] // Capital O, get first item from array
		const winners = values?.winners ?? []
		const betsArray = data.Ok[0].bets;
        const betsCount = betsArray.length;

        if (!values) {
            return {success: false, message: 'No draw data available'}
        }

        return {
            success: true, 
            jackpot: values.jackpot, 
            winningNumber: values.winningNumber, 
            winners: winners, 
			bets: betsCount,
            message: 'Success'
        }
    } catch (error) {
        return {success: false, message: `${error}`};
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

	async executeBet(transactionData: ExecuteBetDto): Promise<{success: boolean, message: string}> {
    try {
        const response = await fetch(`${LIVE_API}/api/bets/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionData),
        });

        // Get the raw text (transaction hash)
        const rawText = await response.text();
        
        if (!response.ok) {
            return {success: false, message: `Status ${response.status}: ${rawText}`}
        }

        // Just return the transaction hash directly, no JSON parsing needed
        return {success: true, message: rawText}
        
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
