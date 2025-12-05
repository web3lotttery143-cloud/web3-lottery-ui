import { ApiPromise, WsProvider } from '@polkadot/api';
import { useIonToast } from '@ionic/react';
import type { AccountInfo } from '@polkadot/types/interfaces';

class WalletService {
  async getBalance() {
    // TEST
    try {
      const provider = new WsProvider([
        'wss://xode-polkadot-rpc-01.zeeve.net/y0yxg038wn1fncc/rpc',
        'wss://polkadot-rpcnode.xode.net',
      ]); // or local node
      const api = await ApiPromise.create({ provider });

      const address = 'XqEQ7cyuHqZbpA6kaXWh4Bqdb4qbR9nCFSUZgq9CPzGsAaNks';

      // Cast the result to AccountInfo
      const accountInfo = (await api.query.system.account(address)) as unknown as AccountInfo;

      const previousFree = accountInfo.data.free.toHuman();
      const previousNonce = accountInfo.nonce.toNumber();
      const balance = await api.query.system.account(address);
      console.log(balance)
      console.log(`${address} has a balance of ${previousFree}, nonce ${previousNonce}`);
      return;
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

  async checkWalletsFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      let walletsParam = params.get('wallets');
      this.getBalance();

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
