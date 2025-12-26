import { useEffect } from 'react';
import webSocketService from '../services/webSocket.service';
import useAppStore from '../store/useAppStore';

export const useWebSocket = () => {
  const {
    setJackpot,
    setJackpot2,
    setNumberOfTicketsSold,
    setNumberOfTicketsSold2,
    setWinningNumber,
    setWinningNumber2,
    setWinners,
    setWinners2,
    setDrawStatus,
    setDrawStatus2,
    setRebate,
    setRebate2,
    setAffiliateEarnings,
    setAffiliateEarnings2,
    walletAddress
  } = useAppStore();

  useEffect(() => {
    webSocketService.connect();

    const handleMessage = (message: any) => {
      if (message.type === 'lottery' || message.type === 'draw') {
        const data = message.data;
        // Assuming data is an array of draws or an object containing draws
        const draws = Array.isArray(data) ? data : data.draws;
        
        if (Array.isArray(draws)) {
            const draw1 = draws[0];
            const draw2 = draws[1];

            if (draw1) {
                const rawJackpot = Number(String(draw1.jackpot).replace(/,/g, ''));
                setJackpot(isNaN(rawJackpot) ? '0.0000' : (rawJackpot / 1_000_000).toFixed(4));
                setNumberOfTicketsSold(draw1.bets?.length || 0);
                setWinningNumber(draw1.winningNumber || 'N/A');
                setWinners(draw1.winners || []);
                setDrawStatus(draw1.status || 'Close');
                
                const rawRebate = Number(String(draw1.rebate).replace(/,/g, ''));
                setRebate(isNaN(rawRebate) ? '0.0000' : (rawRebate / 1_000_000).toFixed(4));

                if (walletAddress) {
                    const matchingWinner = draw1.winners?.find((winner: any) => winner.bettor === walletAddress);
                    setAffiliateEarnings(matchingWinner ? matchingWinner.bettorShare || '0' : '0');
                }
            }

            if (draw2) {
                const rawJackpot = Number(String(draw2.jackpot).replace(/,/g, ''));
                setJackpot2(isNaN(rawJackpot) ? '0.0000' : (rawJackpot / 1_000_000).toFixed(4));
                setNumberOfTicketsSold2(draw2.bets?.length || 0);
                setWinningNumber2(draw2.winningNumber || 'N/A');
                setWinners2(draw2.winners || []);
                setDrawStatus2(draw2.status || 'Close');

                const rawRebate = Number(String(draw2.rebate).replace(/,/g, ''));
                setRebate2(isNaN(rawRebate) ? '0.0000' : (rawRebate / 1_000_000).toFixed(4));

                if (walletAddress) {
                    const matchingWinner = draw2.winners?.find((winner: any) => winner.bettor === walletAddress);
                    setAffiliateEarnings2(matchingWinner ? matchingWinner.bettorShare || '0' : '0');
                }
            }
        }
      }
    };

    webSocketService.addListener(handleMessage);

    return () => {
      webSocketService.removeListener(handleMessage);
    };
  }, [walletAddress, setJackpot, setJackpot2, setNumberOfTicketsSold, setNumberOfTicketsSold2, setWinningNumber, setWinningNumber2, setWinners, setWinners2, setDrawStatus, setDrawStatus2, setRebate, setRebate2, setAffiliateEarnings, setAffiliateEarnings2]);
};
