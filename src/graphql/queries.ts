import { gql } from '@apollo/client';

export const GET_ME_AND_CURRENT_CYCLE = gql`
  query GetMeAndCurrentCycle($walletAddress: String!) {
    me(walletAddress: $walletAddress) {
      id
      walletAddress
      username
      profileImageUrl
      referrerWalletAddress
      totalAffiliateEarnings
      totalRebates
    }
    currentCycle {
      id
      cycleNumber
      status
      totalJackpot
      totalBets
    }
    lastCompletedCycle {
      id
      cycleNumber
      winningNumber
      endedAt
    }
  }
`;

export const GET_MY_BETS = gql`
  query GetMyBets($walletAddress: String!, $page: Int, $limit: Int) {
    myBets(walletAddress: $walletAddress, page: $page, limit: $limit) {
      id
      selectedNumber
      transactionHash
      createdAt
      rebateCredited
      cycle {
        id
        cycleNumber
        status
        winningNumber
      }
    }
  }
`;

export const GET_CYCLE_HISTORY = gql`
  query GetCycleHistory($page: Int, $limit: Int) {
    cycleHistory(page: $page, limit: $limit) {
      id
      cycleNumber
      status
      totalJackpot
      winningNumber
      drawMethod
      totalWinners
      jackpotRolledOver
      endedAt
    }
  }
`;

export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    adminStats {
      totalTicketsSoldCurrentCycle
      activePlayersCurrentCycle
      totalJackpotCurrentCycle
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($walletAddress: String!, $referrer: String) {
    registerUser(walletAddress: $walletAddress, referrer: $referrer) {
      id
      walletAddress
      username
      profileImageUrl
      referrerWalletAddress
      totalAffiliateEarnings # Return this to potentially update state
      totalRebates # Return this to potentially update state
    }
  }
`;

export const PLACE_BET = gql`
  mutation PlaceBet($walletAddress: String!, $selectedNumber: String!, $transactionHash: String!) {
    placeBet(
      walletAddress: $walletAddress
      selectedNumber: $selectedNumber
      transactionHash: $transactionHash
    ) {
      id
      transactionHash
    }
  }
`;

export const TRIGGER_DRAW = gql`
  mutation TriggerDraw($walletAddress: String!, $signature: String!, $winningNumber: String) {
    triggerDraw(
      walletAddress: $walletAddress
      signature: $signature
      winningNumber: $winningNumber
    ) {
      id
      cycleNumber
      winningNumber
    }
  }
`;

export const CLOSE_CYCLE_FOR_DRAW = gql`
  mutation CloseCurrentCycle($walletAddress: String!, $signature: String!) {
    closeCurrentCycle(walletAddress: $walletAddress, signature: $signature) {
      id
      cycleNumber
      status
    }
  }
`;
