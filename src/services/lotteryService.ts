import { AddDrawJackpotDto } from "../models/addDrawJackpot.model";
import { ExecuteBetDto } from "../models/executeBet.model";
import { OverrideWinningNumberDto } from "../models/overrideWinningNumber.model";
import { VITE_API_URL } from "./constants";

const LIVE_API = VITE_API_URL;
	
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
	async getDraws(): Promise<{success: boolean, jackpot?: string, winningNumber?: string, winners?: string[], bets?: any, message?: string, draws?: any[], bettorShare?: string, rebate?: string}> {
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
		const rebate = values?.rebate ?? '0';

        if (!values) {
            return {success: false, message: 'No draw data available'}
        }

        return {
            success: true, 
            jackpot: values.jackpot, 
            winningNumber: values.winningNumber, 
            winners: winners, 
			bets: betsCount,
            message: 'Success',
			draws: data.Ok,
			bettorShare: winners.bettorShare,
			rebate: rebate
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
        const rawText = await response.json();
        
        if (!response.ok) {
            return { success: false, message: `${rawText.message}`} 
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

	async overrideWinningNumber(data: OverrideWinningNumberDto): Promise<{success: boolean, message?: string, data?: string}> {
		try {
			const response = await fetch(`${LIVE_API}/api/draws/override`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return {success: false, message: errorData.message || 'Failed to override winning number'};
			}
			const hex = await response.text();

			return {success: true, data: hex};
		} catch (error) {
			return {success: false, message: `${error}`};
		}

	}

	async executeOverride(hex: string): Promise<{success: boolean, message: string}> {
		try {
			const response = await fetch(`${LIVE_API}/api/draws/execute`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ hex }),
			});

			const data = await response.json()
			const msg = data.message

			if (!response.ok) {
				return { success: false, message: `${msg}`} 
			}

			return {success: true, message: data};
		} catch (err) {
			return { success: false, message: `${err}`} 
		}
	}

	async addJackpot(amount: number): Promise<{success: boolean, message: string, data?: string}> { // create DTO
		try {
			const response = await fetch(`${LIVE_API}/api/draws/add-draw-jackpot`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ amount }),
			});

			const data = await response.text()

			if (!response.ok) {
				throw new Error 
			}

			return {success: true, message: 'Succ', data: data};
		} catch (err) {
			return { success: false, message: `${err}`} 
		}
	}

	async executeDrawJackpot(data: AddDrawJackpotDto): Promise<{success: boolean, message: string}> { // add params
		try {
			const response = await fetch(`${LIVE_API}/api/draws/execute-draw-jackpot`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ data }),
			});

			const res = await response.json()
			const msg = res.message

			if (!response.ok) {
				return { success: false, message: `${msg}`} 
			}

			return {success: true, message: res};
		} catch (err) {
			return { success: false, message: `${err}`} 
		}
	}
}

const lotteryService = new LotteryService();
export default lotteryService;
