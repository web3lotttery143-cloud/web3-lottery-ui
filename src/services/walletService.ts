import { ApiPromise, WsProvider } from "@polkadot/api";
import { useIonToast } from "@ionic/react";
import type { AccountInfo } from "@polkadot/types/interfaces";

class WalletService {

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
		try {
			const callbackUrl = decodeURIComponent(window.location.href);
			const deeplink = `xterium://app/web3/approval?callbackUrl=${callbackUrl}&chainId=3417`;
			window.open(deeplink, '_self');
			
		} catch (error) {
			return error;
		}
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

	async registerWallet(address: string) {
		try {
			const apiUrl =
				import.meta.env.VITE_API_URL ||
				//"https://web3-lottery-api.blockspacecorp.com";
				"";
			console.log(`Registering wallet: ${address} at ${apiUrl}/members`);
			const response = await fetch(`${apiUrl}/members`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ member_address: address, upline_address: "" }),
			});

			if (!response.ok) {
				throw new Error(`Registration failed: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("Registration success:", data);
			return data;
		} catch (error) {
			console.error("Error in registerWallet:", error);
			throw error;
		}
	}

	async checkWalletsFromUrl() {
		try {
			const params = new URLSearchParams(window.location.search);
			let walletsParam = params.get("wallets");

			if (!walletsParam) return;

			// Step 1: Try direct JSON parse
			try {
				const wallets = JSON.parse(walletsParam);

				return wallets;
			} catch {}

			// Step 2: URL decode once
			try {
				const decodedOnce = decodeURIComponent(walletsParam);
				const wallets = JSON.parse(decodedOnce);
				console.log("Connected wallets:", wallets);
				return wallets;
			} catch {}

			// Step 3: URL decode twice (some apps encode twice)
			try {
				const decodedTwice = decodeURIComponent(
					decodeURIComponent(walletsParam)
				);
				const wallets = JSON.parse(decodedTwice);
				console.log("Connected wallets:", wallets);
				return wallets;
			} catch {}

			console.error("Wallet parsing failed");
		} catch (err) {
			console.error("Failed to parse wallets:", err);
		}
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
}

const walletService = new WalletService();
export default walletService;
