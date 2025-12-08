import { ApiPromise, WsProvider } from '@polkadot/api';
import { useIonToast } from '@ionic/react';
import type { AccountInfo } from '@polkadot/types/interfaces';

class WalletService {
  async getBalance(address: string) {
    // TEST
    try {
      const provider = new WsProvider([
        'wss://xode-polkadot-rpc-01.zeeve.net/y0yxg038wn1fncc/rpc',
        'wss://polkadot-rpcnode.xode.net',
      ]); // or local node
      const api = await ApiPromise.create({ provider });

      // Cast the result to AccountInfo
      const accountInfo = (await api.query.system.account(address)) as unknown as AccountInfo;

      const res = accountInfo.data.free.toHuman(); 
      const balance = parseFloat(res)
    
      return balance
    } catch (error) {
      console.log(`There is an error: ${error}`);
    }
  }

  openXterium() {
    try {
      const callbackUrl = decodeURIComponent(window.location.href);
      const deeplink = `xterium://app/web3/approval?callback=${callbackUrl}`;

      return deeplink
    } catch (error) {
      return error;
    }
  }

  async registerWallet(address: string) {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.4:3000';
        console.log(`Registering wallet: ${address} at ${apiUrl}/members`);
        const response = await fetch(`${apiUrl}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ member_address: address, upline_address: '' }),
        });
        
        if (!response.ok) {
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Registration success:', data);
        return data;
    } catch (error) {
        console.error('Error in registerWallet:', error);
        throw error;
    }
  }

  async checkWalletsFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      let walletsParam = params.get('wallets');

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
        console.log('Connected wallets:', wallets);
        return wallets;
      } catch {}

      // Step 3: URL decode twice (some apps encode twice)
      try {
        const decodedTwice = decodeURIComponent(decodeURIComponent(walletsParam));
        const wallets = JSON.parse(decodedTwice);
        console.log('Connected wallets:', wallets);
        return wallets;
      } catch {}

      console.error('Wallet parsing failed');
    } catch (err) {
      console.error('Failed to parse wallets:', err);
    }
  }
}

const walletService = new WalletService();
export default walletService;
