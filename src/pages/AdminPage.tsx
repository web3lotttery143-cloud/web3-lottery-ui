import { useMutation, useQuery } from '@apollo/client';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonLoading,
  useIonToast,
} from '@ionic/react';
import React, { useState } from 'react';
import DigitInput from '../components/DigitInput';
import { CLOSE_CYCLE_FOR_DRAW, GET_ADMIN_STATS, TRIGGER_DRAW } from '../graphql/queries';
import xteriumService from '../services/xteriumService';
import useAppStore from '../store/useAppStore';

const AdminPage: React.FC = () => {
  const { walletAddress, isAdmin } = useAppStore();
  const [presentToast] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  const [forcedWinningNumber, setForcedWinningNumber] = useState('');

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery(GET_ADMIN_STATS, {
    skip: !isAdmin,
    pollInterval: 30000,
    fetchPolicy: 'cache-and-network',
  });

  const [triggerDraw, { loading: loadingDraw }] = useMutation(TRIGGER_DRAW, {
    onCompleted: data => {
      dismissLoading();
      presentToast({
        message: `🎉 Success! Draw #${data.triggerDraw.cycleNumber} completed. Winning number: ${data.triggerDraw.winningNumber}`,
        duration: 5000,
        color: 'success',
      });
      refetchStats();
      setForcedWinningNumber('');
    },
    onError: error => {
      dismissLoading();
      presentToast({
        message: error.message,
        duration: 3000,
        color: 'danger',
      });
    },
  });

  const [closeCycle, { loading: loadingClose }] = useMutation(CLOSE_CYCLE_FOR_DRAW, {
    onCompleted: data => {
      dismissLoading();
      presentToast({
        message: `Cycle #${data.closeCurrentCycle.cycleNumber} manually closed. Ready for Draw!`,
        duration: 3000,
        color: 'success',
      });
      refetchStats();
    },
    onError: error => {
      dismissLoading();
      presentToast({
        message: error.message || 'Failed to close cycle.',
        duration: 3000,
        color: 'danger',
      });
    },
  });

  const handleSignAndMutate = async (
    mutationFn: typeof triggerDraw | typeof closeCycle,
    message: string,
    variables: any
  ) => {
    if (!walletAddress) {
      presentToast({ message: 'Wallet not connected.', duration: 2000, color: 'danger' });
      return;
    }
    await presentLoading({ message: 'Waiting for admin signature...' });
    try {
      const { success, signature } = await xteriumService.signMessage(message);
      if (!success) {
        throw new Error('Admin signature was rejected.');
      }
      await presentLoading({
        message:
          mutationFn === triggerDraw ? '🎰 Drawing winning numbers...' : '🛑 Closing cycle...',
      });

      mutationFn({ variables: { ...variables, walletAddress, signature } });
    } catch (e: any) {
      console.error(e);
      dismissLoading();
      presentToast({
        message: e.message || 'An error occurred during operation.',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleTriggerDraw = () => {
    if (forcedWinningNumber.trim().length > 0 && forcedWinningNumber.trim().length !== 3) {
      presentToast({
        message: 'Forced winning number must be exactly 3 digits.',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    const variables: { winningNumber?: string } = {};
    if (forcedWinningNumber.trim().length === 3) {
      variables.winningNumber = forcedWinningNumber;
    }

    handleSignAndMutate(triggerDraw, 'I am the operator and I authorize this draw.', variables);
  };

  const handleCloseCycle = () => {
    handleSignAndMutate(
      closeCycle,
      'I am the operator and I authorize closing the current cycle for testing.',
      {}
    );
  };

  if (!isAdmin) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>🔒 Admin</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="ion-text-center" style={{ marginTop: '40%' }}>
            <IonText color="danger">
              <h2 style={{ fontWeight: '700' }}>Access Denied</h2>
              <p style={{ color: 'var(--text-color-secondary)' }}>
                You do not have permission to access the admin panel.
              </p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const formatJackpot = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '$?.??';
    return `$${value.toFixed(2)}`;
  };

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>⚡ Admin Panel</IonTitle>
          <IonBadge
            slot="end"
            style={{
              background: 'var(--gold-gradient)',
              color: '#000000',
              fontWeight: '700',
              marginRight: '16px',
            }}
          >
            OPERATOR
          </IonBadge>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="fade-in">
          {/* <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">⚙️ Test Utilities</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'rgba(220, 20, 60, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(220, 20, 60, 0.3)',
                  marginBottom: '16px',
                }}
              >
                <IonText style={{ color: 'var(--lottery-crimson)', fontSize: '0.9rem' }}>
                  This utility forces the current open cycle to close for testing.
                </IonText>
              </div>
              <IonButton
                className="custom-button"
                expand="block"
                onClick={handleCloseCycle}
                disabled={loadingClose}
                style={{
                  '--background': 'var(--lottery-crimson)',
                  '--color': '#ffffff',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  height: '55px',
                }}
              >
                {loadingClose ? 'Closing...' : '🛑 CLOSE CYCLE FOR DRAW (TEST)'}
              </IonButton>
            </IonCardContent>
          </IonCard> */}

          <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">🎯 Lottery Controls</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText
                style={{
                  color: 'var(--text-color-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                Enter a 3-digit number to force a win (optional). If left blank, a random number
                will be generated.
              </IonText>

              <DigitInput value={forcedWinningNumber} onChange={setForcedWinningNumber} />

              <div
                style={{
                  marginTop: '24px',
                  padding: '12px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                }}
              >
                <IonText style={{ color: 'var(--lottery-gold)', fontSize: '0.9rem' }}>
                  ⚠️ This requires the cycle status to be 'PROCESSING'.
                </IonText>
              </div>
              <IonButton
                className="custom-button"
                expand="block"
                onClick={handleTriggerDraw}
                disabled={loadingDraw}
                style={{
                  background: 'var(--lottery-emerald)',
                  '--background': 'var(--lottery-emerald)',
                  '--color': '#ffffff',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  height: '55px',
                  marginTop: '16px',
                }}
              >
                {loadingDraw ? '🎰 Drawing...' : '🚀 TRIGGER DRAW'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">
                📊 Quick Stats (Current Cycle)
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {statsLoading && (
                <div className="ion-text-center">
                  <IonSpinner name="crescent" />
                </div>
              )}
              {statsError && (
                <IonText color="danger">Error loading stats: {statsError.message}</IonText>
              )}
              {!statsLoading && !statsError && statsData && (
                <IonList style={{ background: 'transparent' }}>
                  <IonItem
                    style={{
                      '--background': 'transparent',
                      '--border-color': 'rgba(255, 215, 0, 0.2)',
                    }}
                  >
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)' }}>
                        Total Tickets Sold
                      </IonText>
                    </IonLabel>
                    <IonText slot="end" style={{ color: 'var(--lottery-gold)', fontWeight: '700' }}>
                      {statsData.adminStats.totalTicketsSoldCurrentCycle ?? 'N/A'}
                    </IonText>
                  </IonItem>
                  <IonItem
                    style={{
                      '--background': 'transparent',
                      '--border-color': 'rgba(255, 215, 0, 0.2)',
                    }}
                  >
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)' }}>
                        Active Players
                      </IonText>
                    </IonLabel>
                    <IonText
                      slot="end"
                      style={{ color: 'var(--lottery-emerald)', fontWeight: '700' }}
                    >
                      {statsData.adminStats.activePlayersCurrentCycle ?? 'N/A'}
                    </IonText>
                  </IonItem>
                  <IonItem
                    style={{
                      '--background': 'transparent',
                      '--border-color': 'rgba(255, 215, 0, 0.2)',
                    }}
                  >
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)' }}>
                        Total Jackpot
                      </IonText>
                    </IonLabel>
                    <IonText slot="end" style={{ color: 'var(--lottery-gold)', fontWeight: '700' }}>
                      {formatJackpot(statsData.adminStats.totalJackpotCurrentCycle)}
                    </IonText>
                  </IonItem>
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)' }}>
                        System Status
                      </IonText>
                    </IonLabel>
                    <IonBadge
                      slot="end"
                      style={{
                        background: 'var(--lottery-emerald)',
                        color: '#ffffff',
                        fontWeight: '700',
                      }}
                    >
                      OPERATIONAL
                    </IonBadge>
                  </IonItem>
                </IonList>
              )}
            </IonCardContent>
          </IonCard> */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminPage;
