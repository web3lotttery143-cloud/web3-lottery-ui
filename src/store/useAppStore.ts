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
  numberOfTicketsSold: number;
  maximumBets: string | null;
  draw: string | null
  winningNumber: string | null;
  winningNumber2: string | null;
  jackpot: string | null;
  jackpot2: string | null;
  winners: any[];
  winners2: any[];
  walletBalance: string | null
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  setUserProfile: (profile: UserProfile) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLastSeenCompletedCycle: (cycleNumber: number) => void;
  setGlobalBetNumber: (betNumber: number) => void;
  setLoginState: (login: boolean) => void;
  setReferralUpline: (referral: string) => void
  setNumberOfTicketsSold: (ticketsSold: number) => void
  setMaximumBets: (maximumBets: string) => void
  setDraw: (draw: string) => void
  setWinningNumber: (winningNumber: string) => void
  setWinningNumber2: (winningNumber2: string) => void
  setJackpot: (jackpot: string) => void
  setJackpot2: (jackpot2: string) => void
  setWinners: (winners: any[]) => void;
  setWinners2: (winners2: any[]) => void;
  setWalletBalance: (balance: string) => void;
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
      numberOfTicketsSold: 0,
      maximumBets: null,
      draw: '1',
      winningNumber: null,
      winningNumber2: null,
      jackpot: null,
      jackpot2: null,
      winners: [],     
      winners2: [],
      walletBalance: null,
      connectWallet: address => set({ isConnected: true, walletAddress: address }),
      disconnectWallet: () =>
        set({
          isConnected: false,
          isAdmin: false,
          walletAddress: null,
          userProfile: null,
          lastSeenCompletedCycle: 0,
          globalBetNumber: 0,
          loginState: false,
          referralUpline: null,
          numberOfTicketsSold: 0,
          maximumBets: null,
          draw: '1',
          winningNumber: null,
          winningNumber2: null,
          jackpot: null,
          jackpot2: null,
          winners: [],
          winners2: [],
          walletBalance: null,
        }),
      setUserProfile: profile => set({ userProfile: profile }),
      setIsAdmin: isAdmin => set({ isAdmin }),
      setLastSeenCompletedCycle: cycleNumber => set({ lastSeenCompletedCycle: cycleNumber }),
      setGlobalBetNumber: betNumber => set({ globalBetNumber: betNumber }),
      setLoginState: login => set({loginState: login}),
      setReferralUpline: referral => set({referralUpline: referral}),
      setNumberOfTicketsSold: ticketsSold => set({numberOfTicketsSold: ticketsSold}),
      setMaximumBets: maximumBets => set({maximumBets: maximumBets}),
      setDraw: draw => set({draw: draw}),
      setWinningNumber: winningNumber => set({winningNumber: winningNumber}),
      setWinningNumber2: winningNumber2 => set({winningNumber2: winningNumber2}),
      setJackpot: jackpot => set({jackpot: jackpot}),
      setJackpot2: jackpot2 => set({jackpot2: jackpot2}),
      setWinners: winners => set({ winners }),
      setWinners2: winners2 => set({ winners2 }),
      setWalletBalance: balance => set({ walletBalance: balance }),
    }),
    {
      name: 'web3-lottery-app-storage',
    }
  )
);

export default useAppStore;
