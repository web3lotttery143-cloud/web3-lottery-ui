import { ApiPromise, WsProvider } from "@polkadot/api";
import { SaveBetDto } from "../models/saveBet.model";
import { useIonToast } from "@ionic/react";
import type { AccountInfo } from "@polkadot/types/interfaces";

class WalletService {
	apiUrl = import.meta.env.VITE_API_URL
	async getBalance(address: string) {
		try {
			const provider = new WsProvider(import.meta.env.VITE_WS_PROVIDER || "");
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

	 openXterium() {
		const callbackUrl = decodeURIComponent(window.location.href);
		const deeplink = `xterium://app/web3/approval?callbackUrl=${callbackUrl}&chainId=3417`;
		window.open(deeplink, "_self");
	}

	async signTransaction(hex: string, address: string) {
		try {
			const callbackUrl = encodeURIComponent(window.location.href);
			const deeplink = `xterium://app/web3/sign-transaction?encodedCallDataHex=${hex}&callbackUrl=${callbackUrl}&walletAddress=${address}`;
			window.location.href = deeplink;
		} catch (error) {
			return `Something went wrong: ${error}`;
		}
	}

	async registerWallet(address: string, uplineAddress?: string): Promise<{success: boolean, message: string, data?: any}> {
		try {
			const response = await fetch(`${this.apiUrl}/members`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ member_address: address, upline_address: uplineAddress || import.meta.env.VITE_OPERATOR_ADDRESS }),
			});

			const data = await response.json();

			if (!response.ok) {
				return {success: false, message: data.message}
			}
			return {success: true, message: data.message, data: data.data.upline_address}
		} catch (error) {
			return {success: false, message: `${error}`}
		}
	}

	async loginWallet(address: string): Promise<{success: boolean, message: string, data?: any}> {
    try {
		if(address == import.meta.env.VITE_OPERATOR_ADDRESS) {
			return {success: true, message: 'Operator Connected...', data: 'Admin'}
		}
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

			let walletsParam = params.get("wallets");
			

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
			const status = params.get("status");
			if (!status) {
				return { success: false, signedTx: "" };
			}

			const signedTx = params.get("signedTx") || "";
			const betNumber = params.get("betNumber") || "";

			return { success: true, signedTx: signedTx };
		} catch (err) {
			return { success: false, signedTx: "" };
		}
	};

	async saveBets(betData: SaveBetDto): Promise<{success: boolean, message: string}> {
		try {
			const response = await fetch(`${this.apiUrl}/member/bets`, {
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
}

const walletService = new WalletService();
export default walletService;
