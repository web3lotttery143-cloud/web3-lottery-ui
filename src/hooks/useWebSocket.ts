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
    walletAddress
  } = useAppStore();

  useEffect(() => {
    webSocketService.connect();

    const handleMessage = (message: any) => {
      if (message.type === 'draw' && message.data) {
        const data = message.data;
        const drawNumber = data.drawNumber;

        // Parse pot: "2.25 USDT" -> "2.2500"
        let jackpotValue = '0.0000';
        if (typeof data.pot === 'string') {
            const num = parseFloat(data.pot.replace(/[^\d.-]/g, ''));
            if (!isNaN(num)) {
                jackpotValue = num.toFixed(4);
            }
        }

        const betsCount = typeof data.bets === 'number' ? data.bets : 0;
        const winningNum = data.winningNumber !== undefined ? String(data.winningNumber) : 'N/A';
        const status = data.status || 'Close';

        if (drawNumber === 1) {
            setJackpot(jackpotValue);
            setNumberOfTicketsSold(betsCount);
            setWinningNumber(winningNum);
            setDrawStatus(status);
            
            if (Array.isArray(data.winners)) {
                setWinners(data.winners);
                 if (walletAddress) {
                    const matchingWinner = data.winners.find((winner: any) => winner.bettor === walletAddress);
                    //setAffiliateEarnings(matchingWinner ? matchingWinner.bettorShare || '0' : '0');
                }
            } else if (status === 'Open') {
                setWinners([]);
                //setAffiliateEarnings('0');
            }
        } else if (drawNumber === 2) {
            setJackpot2(jackpotValue);
            setNumberOfTicketsSold2(betsCount);
            setWinningNumber2(winningNum);
            setDrawStatus2(status);

             if (Array.isArray(data.winners)) {
                setWinners2(data.winners);
                 if (walletAddress) {
                    const matchingWinner = data.winners.find((winner: any) => winner.bettor === walletAddress);
                    //setAffiliateEarnings2(matchingWinner ? matchingWinner.bettorShare || '0' : '0');
                }
            } else if (status === 'Open') {
                setWinners2([]);
                //setAffiliateEarnings2('0');
            }
        }
      }
    };

    webSocketService.addListener(handleMessage);

    return () => {
      webSocketService.removeListener(handleMessage);
    };
  }, [walletAddress, setJackpot, setJackpot2, setNumberOfTicketsSold, setNumberOfTicketsSold2, setWinningNumber, setWinningNumber2, setWinners, setWinners2, setDrawStatus, setDrawStatus2]);
};
