import { useMutation } from '@apollo/client';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
  useIonLoading,
  useIonToast,
} from '@ionic/react';
import React, { useState } from 'react';
import DigitInput from '../components/DigitInput';
import { PLACE_BET } from '../graphql/queries';
import xteriumService from '../services/xteriumService';
import useAppStore from '../store/useAppStore';

interface DashboardPageProps {
  data: any;
  loading: boolean;
  refetch: () => Promise<any>;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ data, loading, refetch }) => {
  const { walletAddress } = useAppStore();
  const [betNumber, setBetNumber] = useState('');
  const [presentLoading, dismissLoading] = useIonLoading();
  const [presentToast] = useIonToast();

  const [placeBet, { loading: placingBet }] = useMutation(PLACE_BET, {
    onCompleted: data => {
      presentToast({
        message: `Bet placed successfully! Tx: ${data.placeBet.transactionHash.substring(
          0,
          10
        )}...`,
        duration: 1000,
        color: 'success',
      });
      setBetNumber('');
      refetch();
    },
    onError: error => {
      presentToast({
        message: error.message,
        duration: 1000,
        color: 'danger',
      });
    },
  });

  const handlePlaceBet = async () => {
    if (betNumber.trim().length !== 3) {
      presentToast({
        message: 'Please enter a 3-digit number.',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!walletAddress) {
      presentToast({
        message: 'Wallet not connected.',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    await presentLoading({ message: 'Waiting for signature...' });

    try {
      const { success, txHash } = await xteriumService.signTransaction({
        type: 'placeBet',
        number: betNumber,
        cost: '0.50',
      });

      if (!success) {
        throw new Error('Transaction signature was rejected.');
      }

      presentLoading({ message: 'Submitting transaction...' });
      await placeBet({
        variables: {
          walletAddress: walletAddress,
          selectedNumber: betNumber,
          transactionHash: txHash,
        },
      });
    } catch (e: any) {
      console.error(e);
      presentToast({
        message: e.message || 'An error occurred.',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      dismissLoading();
    }
  };

  const handleRefresh = (event: CustomEvent) => {
    refetch().finally(() => event.detail.complete());
  };

  const cycle = data?.currentCycle;

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>🛖 Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="fade-in">
          <IonCard className="custom-card jackpot-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title ion-text-center">
                🎰 JACKPOT 🎰
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-text-center">
              <IonText color="warning">
                <h1
                  style={{
                    fontSize: '3.5rem',
                    fontWeight: '900',
                    margin: '0',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 4px 8px rgba(255, 215, 0, 0.3)',
                  }}
                >
                  ${cycle ? parseFloat(cycle.totalJackpot).toFixed(2) : '0.00'}
                </h1>
              </IonText>
              <IonText>
                <p
                  style={{
                    color: 'var(--text-color-secondary)',
                    margin: '16px 0',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                  }}
                >
                  {cycle ? cycle.totalBets : 0} / 10,000 Tickets Sold
                </p>
              </IonText>
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{ width: `${(cycle?.totalBets || 0) / 100}%` }}
                ></div>
              </div>
              <IonText>
                <p
                  style={{
                    color: 'var(--lottery-gold)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginTop: '8px',
                  }}
                >
                  Next Draw: When 10,000 tickets are sold!
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>

          <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">🎯 PLACE YOUR BET</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <DigitInput value={betNumber} onChange={setBetNumber} />

              <IonButton
                className="custom-button bet-button"
                expand="block"
                onClick={handlePlaceBet}
                disabled={placingBet}
                style={{ marginTop: '24px' }}
              >
                🎫 Buy Ticket - $0.50
              </IonButton>

              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                }}
              >
                <IonText style={{ color: 'var(--lottery-gold)', fontSize: '0.9rem' }}>
                  💰 Instant $0.05 rebate + referral earnings on every ticket!
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
