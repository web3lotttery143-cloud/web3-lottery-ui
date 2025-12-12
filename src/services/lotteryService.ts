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

	async executeBet(transactionData: ExecuteBetDto) {
		try {
			const response = await fetch(`${LIVE_API}/api/bets/execute`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(transactionData),
			});

			// if (response.status == 500) {
			// 	throw new Error(`Adding of bet failed: ${response.status}`);
			// }

			// Read raw response
			const text = await response.text();
			console.log("RAW RESPONSE:", text);

			// Try parsing JSON
			try {
				return JSON.parse(text);
			} catch {
				console.error("Backend returned NON-JSON response.");
				return text; // return raw text instead of crashing
			}
		} catch (error) {
			throw error;
		}
	}

	//     async executeBet(transactionData: ExecuteBetDto) {
	//     try {
	//         const response = await fetch(`${LIVE_API}/api/bets/execute`, {
	//             method: "POST",
	//             headers: {
	//                 "Content-Type": "application/json",
	//             },
	//             body: JSON.stringify(transactionData),
	//         });

	//         const raw = await response.text(); // read raw response

	//         if (!response.ok) {
	//             // Backend returned an error (4xx / 5xx)
	//             return {
	//                 ok: false,
	//                 error: raw || `Execute bet failed: ${response.status}`,
	//             };
	//         }

	//         // Try parsing JSON
	//         try {
	//             const parsed = JSON.parse(raw);
	//             return {
	//                 ok: true,
	//                 data: parsed,
	//             };
	//         } catch {
	//             // Valid response but not JSON
	//             return {
	//                 ok: true,
	//                 data: raw,
	//             };
	//         }
	//     } catch (err) {
	//         // Network errors, crashed server, no internet, etc.
	//         let message = "Unknown error";

	//         if (err instanceof Error) message = err.message;

	//         return {
	//             ok: false,
	//             error: message,
	//         };
	//     }
	// }

	// async addBet() { //WORKING VERSION
	// 	try {
	// 		const response = await fetch(`${LIVE_API}/api/bets/add`, {
	// 			method: "POST",
	// 		});

	// 		if (response.status != 201) {
	// 			throw new Error();
	// 		}

	// 		const data = await response.json();
	// 		return data;
	// 	} catch (error) {
	// 		return error;
	// 	}
	// }

	async addBet() {
		try {
			const response = await fetch(`${LIVE_API}/api/bets/add`, {
				method: "POST",
			});

			if (!response.ok) {
				return {
					ok: false,
					error: await response.text(),
				};
			}

			return {
				ok: true,
				data: await response.json(),
			};
		} catch (err) {
			let message = "Unknown error";

			if (err instanceof Error) {
				message = err.message;
			}

			return {
				ok: false,
				error: message,
			};
		}
	}
}

const lotteryService = new LotteryService();
export default lotteryService;
