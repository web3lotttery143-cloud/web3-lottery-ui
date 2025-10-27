// DUMMY SERVICE TO SIMULATE THE XTERIUM SDK.

const ADMIN_WALLET = import.meta.env.VITE_OPERATOR_WALLET_ADDRESS?.toLowerCase();

const dummyWallets = [
  '0x1B2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
  '0x9D8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c',
  '0x5E4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d',
  '0x7F6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
];

class XteriumService {
  async connectUser(): Promise<{ walletAddress: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * dummyWallets.length);
        const selectedWallet = dummyWallets[randomIndex];
        console.log(`[Xterium Simulator] Connected with USER wallet: ${selectedWallet}`);
        resolve({ walletAddress: selectedWallet });
      }, 500);
    });
  }

  //  Simulates an ADMIN wallet connection.
  async connectAdmin(): Promise<{ walletAddress: string }> {
    return new Promise((resolve, reject) => {
      if (!ADMIN_WALLET) {
        console.error('[Xterium Simulator] ERROR: VITE_OPERATOR_WALLET_ADDRESS is not set in .env');
        reject(new Error('Admin wallet not configured in frontend .env'));
        return;
      }
      setTimeout(() => {
        console.log(`[Xterium Simulator] Connected with ADMIN wallet: ${ADMIN_WALLET}`);
        resolve({ walletAddress: ADMIN_WALLET });
      }, 500);
    });
  }

  // Simulates signing a transaction.
  async signTransaction(transactionData: any): Promise<{ success: boolean; txHash: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const txHash = `sim-tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        console.log('[Xterium Simulator] User prompted to sign transaction:', transactionData);
        console.log(`[Xterium Simulator] Transaction signed successfully. Hash: ${txHash}`);
        resolve({
          success: true,
          txHash: txHash,
        });
      }, 1500);
    });
  }

  // Simulates signing an unofficial message
  async signMessage(message: string): Promise<{ success: boolean; signature: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const signature = `sim-sig-${Date.now()}-${Math.random().toString(36).substring(2, 20)}`;
        console.log(`[Xterium Simulator] User prompted to sign message: "${message}"`);
        console.log(`[Xterium Simulator] Message signed successfully. Signature: ${signature}`);
        resolve({
          success: true,
          signature: signature,
        });
      }, 1000);
    });
  }
}

const xteriumService = new XteriumService();
export default xteriumService;
