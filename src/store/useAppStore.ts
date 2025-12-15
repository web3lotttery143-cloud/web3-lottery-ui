import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  profileImageUrl?: string;
  referrerWalletAddress?: string;
  totalAffiliateEarnings: number;
  totalRebates: number;
}

export interface AppState {
  isConnected: boolean;
  isAdmin: boolean;
  walletAddress: string | null;
  userProfile: UserProfile | null;
  lastSeenCompletedCycle: number;
  globalBetNumber: number;
  loginState: boolean;
  referralUpline: string | null;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  setUserProfile: (profile: UserProfile) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLastSeenCompletedCycle: (cycleNumber: number) => void;
  setGlobalBetNumber: (betNumber: number) => void;
  setLoginState: (login: boolean) => void;
  setReferralUpline: (referral: string) => void
}

const useAppStore = create<AppState>()(
  persist(
    set => ({
      isConnected: false,
      isAdmin: false,
      walletAddress: null,
      userProfile: null,
      lastSeenCompletedCycle: 0,
      globalBetNumber: 0,
      loginState: false,
      referralUpline: null,
      connectWallet: address => set({ isConnected: true, walletAddress: address }),
      disconnectWallet: () =>
        set({
          isConnected: false,
          walletAddress: null,
          userProfile: null,
          isAdmin: false,
          lastSeenCompletedCycle: 0,
          referralUpline: null
        }),
      setUserProfile: profile => set({ userProfile: profile }),
      setIsAdmin: isAdmin => set({ isAdmin }),
      setLastSeenCompletedCycle: cycleNumber => set({ lastSeenCompletedCycle: cycleNumber }),
      setGlobalBetNumber: betNumber => set({ globalBetNumber: betNumber }),
      setLoginState: login => set({loginState: login}),
      setReferralUpline: referral => set({referralUpline: referral})
    }),
    {
      name: 'web3-lottery-app-storage',
    }
  )
);

export default useAppStore;
