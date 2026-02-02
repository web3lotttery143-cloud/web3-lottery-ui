import { ApiPromise, WsProvider } from "@polkadot/api";
import { SaveBetDto } from "../models/saveBet.model";
import { useIonToast } from "@ionic/react";
import type { AccountInfo } from "@polkadot/types/interfaces";
import { VITE_API_URL, VITE_WS_PROVIDER, VITE_OPERATOR_ADDRESS } from "./constants";

class WalletService {
	apiUrl = VITE_API_URL
	async getBalance(address: string) {
		try {
			const provider = new WsProvider(VITE_WS_PROVIDER|| "");
			const api = await ApiPromise.create({ provider });

			const USDT_CURRENCY_ID = 1984;
			const DECIMALS = 6;

			const accountData = await api.query.assets.account(
				USDT_CURRENCY_ID,
				address
			);

			if (accountData.isEmpty) {
				return "0";
			}

			const json = accountData.toJSON() as any;
			const raw = json.balance?.toString() || "0";

			const exact = (Number(raw) / 10 ** DECIMALS).toString();

			return exact;
		} catch (error) {
			console.log("Error:", error);
		}
	}

	//  openXterium() {
	// 	const callbackUrl = decodeURIComponent(window.location.href);
	// 	const deeplink = `xterium://app/web3/approval?callbackUrl=${callbackUrl}&chainId=3417`;
	// 	window.open(deeplink, "_self");
	// }

	async signTransaction(hex: string, address: string) {
		try {
			const callbackUrl = encodeURIComponent(window.location.href);
			const genesisHash = "0xb2985e778bb748c70e450dcc084cc7da79fe742cc23d3b040abd7028187de69c";
			const payload = {
				address: address,
				genesis_hash: genesisHash,
				transaction_hex: hex	
			}
			const deeplink = `https://deeplink.xterium.app/web3/sign-transaction?signingType=signTransactionHex&payload=${JSON.stringify(payload)}&callbackUrl=${callbackUrl}`;
			window.location.href = deeplink;
		} catch (error) {
			return `Something went wrong: ${error}`;
		}
	}

	async registerWallet(address: string | string[], uplineAddress?: string): Promise<{success: boolean, message: string, data?: any}> {
		if (Array.isArray(address)) {
			try {
				const responses = await Promise.all(address.map(addr => this.registerWallet(addr, uplineAddress)));
				const failed = responses.find(r => !r.success);
				if (failed) return failed;
				
				const operator = responses.find(r => r.message === 'Operator Connected...');
				if (operator) return operator;
				
				return { success: true, message: responses[0]?.message || "Success", data: responses.map(r => r.data) };
			} catch (error) {
				return { success: false, message: `${error}` };
			}
		}

		try {
			const response = await fetch(`${this.apiUrl}/members`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ member_address: address, upline_address: uplineAddress || ""}),
			});

			const data = await response.json();

			if (!response.ok) {
				return {success: false, message: data.message}
			}

			if(address == VITE_OPERATOR_ADDRESS) {
			return {success: true, message: 'Operator Connected...', data: data.data.upline_address}
		}
			return {success: true, message: data.message, data: data.data.upline_address}
		} catch (error) {
			return {success: false, message: `${error}`}
		}
	}

	async loginWallet(address: string): Promise<{success: boolean, message: string, data?: any}> {
    try {
		
        const response = await fetch(`${this.apiUrl}/members/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ member_address: address, upline_address: "" }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {success: false, message: data.error}
        }

		if(address == VITE_OPERATOR_ADDRESS) {
			return {success: true, message: 'Operator Connected...', data: data.data.upline_address}
		}

        return {success: true, message: data.message, data: data.data.upline_address};
    } catch (error) {
        return {success: false, message: `${error}`}
    	}
	}	

	async checkWalletsFromUrl(isNormalizeSearch?: boolean) {
		try {
			let params
			let ref
			if (isNormalizeSearch) {
				const rawSearch = window.location.search
				const fixedSearch = this.normalizeSearch(rawSearch)
				params = new URLSearchParams(fixedSearch)
        		
			} else {
				params = new URLSearchParams(window.location.search);
			}

			let walletsParam = params.get("selectedAccounts");
			

			if (!walletsParam) return;

			try {
				const decodedOnce = decodeURIComponent(walletsParam);
				const wallets = JSON.parse(decodedOnce);

				return wallets
				
			} catch {}

		} catch (err) {
			console.error("Failed to parse wallets:", err);
		}
	}

	normalizeSearch(search: string) {
		const firstQ = search.indexOf("?");
		if (firstQ === -1) return search;

		const secondQ = search.indexOf("?", firstQ + 1);
		if (secondQ === -1) return search;

		return (
			search.slice(0, secondQ) +
			"&" +
			search.slice(secondQ + 1)
		);
	}

	async checkSignedTxFromUrl(): Promise<{success: boolean, signedTx: string}> {
		
		try {
			const params = new URLSearchParams(window.location.search);
			// const status = params.get("status");
			// if (!status) {
			// 	return { success: false, signedTx: "" };
			// }

			const signedTx = params.get("signedTransactionHex") || "";
			if(!signedTx) {
				return { success: false, signedTx: "" };
			}
			// const betNumber = params.get("betNumber") || "";

			return { success: true, signedTx: signedTx };
		} catch (err) {
			return { success: false, signedTx: "" };
		}
	};

	async saveBets(betData: SaveBetDto): Promise<{success: boolean, message: string}> {
		try {
			const response = await fetch(`${this.apiUrl}/members/bets`, {
				method: "POST",			
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(betData)
			});

			const data = await response.json();

			if (!response.ok) {
				return {success: false, message: data.message}
			}
			return {success: true, message: data.message}
		} catch (error) {
			return {success: false, message: `${error}`};
		}
	}

	async getBets(walletAddress: string): Promise<{success: boolean, message: string, data?: any}> {
		try {
			const response = await fetch(`${this.apiUrl}/bets/${walletAddress}`);

			return {success: true, message: "Bets fetched successfully", data: await response.json()}
		} catch (error) {
			return {success: false, message: `${error}`};
		}
	}

	async getMemberBets(walletAddress: string): Promise<{success: boolean, message: string, data?: any}> {
		try {
			const response = await fetch(`${this.apiUrl}/members/bets/${walletAddress}`);
			if(!response.ok) {
				return {success: false, message: "Failed to fetch member bets"};
			}

			const data = await response.json();
			
			return {success: true, message: "Member bets fetched successfully", data: data}
		} catch (error) {
			return {success: false, message: `${error}`};
		}
	}
}

const walletService = new WalletService();
export default walletService;
