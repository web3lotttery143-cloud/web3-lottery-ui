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
  expectedWinningNumber: number;
  jackpot: string | null;
  jackpot2: string | null;
  winners: any[];
  winners2: any[];
  walletBalance: string | null
  drawStatus: string | null;
  drawStatus2: string | null;
  isAfter10Am: boolean;
  numberOfTicketsSold2: number;
  rebate: string | null;
  rebate2: string | null;
  affiliateEarnings: number;
  affiliateEarnings2: string | null
  isSubmitting: boolean;
  isOverrideMode: boolean;
  isAddJackpotMode: boolean;
  jackpotAmount: number
  availableWallets: { address: string; label: string }[];
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  setUserProfile: (profile: UserProfile) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLastSeenCompletedCycle: (cycleNumber: number) => void;
  setGlobalBetNumber: (betNumber: number) => void;
  setLoginState: (login: boolean) => void;
  setAvailableWallets: (wallets: { address: string; label: string }[]) => void;
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
  setDrawStatus: (status: string) => void;
  setDrawStatus2: (status2: string) => void;
  setIsAfter10Am: (isAfter10Am: boolean) => void;
  setNumberOfTicketsSold2: (ticketsSold2: number) => void;
  setRebate: (rebate: string) => void;
  setRebate2: (rebate2: string) => void;
  setAffiliateEarnings: (affiliateEarnings: number) => void;
  setAffiliateEarnings2: (affiliateEarnings2: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setIsOverrideMode: (isOverrideMode: boolean) => void;
  setIsAddJackpotMode: (isAddJackpotMode: boolean) => void;
  setExpectedWinningNumber: (expectedWinningNumber: number) => void;
  setJackpotAmount: (jackpotAmount: number) => void;
}

const useAppStore = create<AppState>()(
  persist(
    set => ({
      isConnected: false,
      isAdmin: true,
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
      expectedWinningNumber: 0,
      jackpot: null,
      jackpot2: null,
      winners: [],     
      winners2: [],
      walletBalance: null,
      drawStatus: null,
      drawStatus2: null,
      isAfter10Am: false,
      numberOfTicketsSold2: 0,
      rebate: null,
      rebate2: null,
      affiliateEarnings: 0,
      affiliateEarnings2: null,
      isSubmitting: false,
      isOverrideMode: false,
      isAddJackpotMode: false,
      jackpotAmount: 0,
      availableWallets: [],
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
          drawStatus: null,
          drawStatus2: null,
          isAfter10Am: false,
          numberOfTicketsSold2: 0,
          rebate: null,
          rebate2: null,
          affiliateEarnings: 0,
          affiliateEarnings2: null,
          isSubmitting: false,
          isOverrideMode: false,
          isAddJackpotMode: false,
          availableWallets: [],
          jackpotAmount: 0,
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
      setDrawStatus: status => set({ drawStatus: status }),
      setDrawStatus2: status2 => set({ drawStatus2: status2 }),
      setIsAfter10Am: isAfter10Am => set({ isAfter10Am: isAfter10Am }),
      setNumberOfTicketsSold2: ticketsSold2 => set({numberOfTicketsSold2: ticketsSold2}),
      setRebate: rebate => set({ rebate: rebate }),
      setRebate2: rebate2 => set({ rebate2: rebate2 }),
      setAffiliateEarnings: affiliateEarnings => set({ affiliateEarnings: affiliateEarnings }),
      setAffiliateEarnings2: affiliateEarnings2 => set({ affiliateEarnings2: affiliateEarnings2 }),
      setIsSubmitting: isSubmitting => set({ isSubmitting: isSubmitting }),
      setIsOverrideMode: isOverrideMode => set({ isOverrideMode: isOverrideMode }),
      setIsAddJackpotMode: isAddJackpotMode => set({ isAddJackpotMode: isAddJackpotMode }),
      setExpectedWinningNumber: expectedWinningNumber => set({ expectedWinningNumber: expectedWinningNumber }),
      setAvailableWallets: wallets => set({ availableWallets: wallets }),
      setJackpotAmount: jackpotAmount => set({ jackpotAmount: jackpotAmount }),
    }),
    {
      name: 'web3-lottery-app-storage',
    }
  )
);

export default useAppStore;
