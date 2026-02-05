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
  IonToggle,
  IonInput,
  IonIcon
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import DigitInput from '../components/DigitInput';
import { CLOSE_CYCLE_FOR_DRAW, GET_ADMIN_STATS, TRIGGER_DRAW } from '../graphql/queries';
import xteriumService from '../services/xteriumService';
import useAppStore from '../store/useAppStore';
import lotteryService from '../services/lotteryService';
import walletService from '../services/walletService';
import { cashOutline } from 'ionicons/icons';

const AdminPage: React.FC = () => {
  const { walletAddress, isAdmin, isAfter10Am, drawStatus, drawStatus2, setIsOverrideMode, isOverrideMode, setExpectedWinningNumber, expectedWinningNumber, isAddJackpotMode, setIsAddJackpotMode, jackpotAmount, setJackpotAmount } = useAppStore();
  const [presentToast] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  const [forcedWinningNumber, setForcedWinningNumber] = useState('');
  const [potAmount, setPotAmount] = useState('');

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

  const handleOverrideWinningNumber = async () => {
    try {
      const currentDrawStatus = isAfter10Am ? drawStatus2 : drawStatus;
      const currentDrawNumber = isAfter10Am ? 2 : 1;

      if (currentDrawStatus !== 'Processing') {
        presentToast({
          message: 'Cycle status must be PROCESSING to override winning number.',
          duration: 3000,
          color: 'danger',
        });
        return;
      }
      await presentLoading({ message: 'Overriding winning number...' });

      const res = await lotteryService.overrideWinningNumber({
        draw_number: currentDrawNumber,
        winning_number: Number(forcedWinningNumber),
      });

      if (!res.success) {
        presentToast({
          message: `Error: ${res.message}`,
          duration: 3000,
          color: 'danger',
        });
        return;
      }
      setExpectedWinningNumber(Number(forcedWinningNumber));

      const signedHex = walletService.signTransaction(res.data!, walletAddress!) //open xterium wallet (can make not await since we won't be expecting a return from this)

      // next is add the functionality to send the signed hex to backend to process the transaction
      presentToast({
        message: `${res.data}`,
        duration: 3000,
        color: 'success',
      });
    } catch (error: any) {
      presentToast({
        message: error.message || 'An error occurred while overriding winning number.',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      dismissLoading();
    }
  };

    // Members bets
    const [bets, setBets] = useState<any[]>([]);
    const [loadingBets, setLoadingBets] = useState(false);
    const [betsError, setBetsError] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      const loadBets = async () => {
        setLoadingBets(true);
        setBetsError(null);
        try {
          const res: any = await lotteryService.getAllBets();
          let list: any[] = [];
          if (Array.isArray(res)) list = res;
          else if (res?.Ok) list = res.Ok;
          else if (res?.success === false && res.message) {
            setBetsError(res.message);
          }

          if (mounted && Array.isArray(list)) setBets(list);
        } catch (e: any) {
          if (mounted) setBetsError(e.message || `${e}`);
        } finally {
          if (mounted) setLoadingBets(false);
        }
      };

      loadBets();
      return () => {
        mounted = false;
      };
    }, []);

  const handleAddPotMoney = async () => {
    const amount = Number(potAmount);

    if (!potAmount.trim()) {
      presentToast({
        message: 'Please enter an amount.',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      presentToast({
        message: 'Please enter a valid amount greater than 0.',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    await presentLoading({ message: 'Adding pot money...' });
    try {
      // TODO: Implement pot money addition API call

      const res = await lotteryService.addJackpot(amount);

      if (!res.success) {
        presentToast({
          message: `Error: ${res.message}`,
          duration: 3000,
          color: 'danger',
        })
        return;
      }

      setJackpotAmount(amount);
      const signedHex = walletService.signTransaction(res.data!, walletAddress!) //open xterium wallet (can make not await since we won't be expecting a return from this)
      
      presentToast({
        message: `${res.data}`,
        duration: 3000,
        color: 'success',
      });
      setPotAmount('');
    } catch (error: any) {
      presentToast({
        message: error.message || 'Failed to add pot money.',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      dismissLoading();
    }
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
              <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: isOverrideMode
                ? '1px solid var(--lottery-gold)'
                : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
              >
              <div>
                <IonText
                style={{
                  color: isOverrideMode ? 'var(--lottery-gold)' : 'var(--text-color-primary)',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  display: 'block',
                }}
                >
                Override Mode
                </IonText>
                <IonText
                style={{
                  color: 'var(--text-color-secondary)',
                  fontSize: '0.85rem',
                  marginTop: '4px',
                  display: 'block',
                }}
                >
                {isOverrideMode ? 'Manual control enabled' : 'Standard operation'}
                </IonText>
              </div>
              <IonToggle
                mode="ios"
                checked={isOverrideMode}
                onIonChange={e => {
                  setIsOverrideMode(e.detail.checked);
                  if (e.detail.checked) setIsAddJackpotMode(false);
                }}
                style={{
                '--handle-background-checked': 'var(--lottery-gold)',
                '--background-checked': 'rgba(255, 215, 0, 0.2)',
                }}
              />
              </div>

              <div
              style={{
                opacity: isOverrideMode ? 1 : 0.5,
                pointerEvents: isOverrideMode ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
              }}
              >
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
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <IonText style={{ color: 'var(--lottery-gold)', fontSize: '0.9rem' }}>
                This requires the cycle status to be <strong>PROCESSING</strong>.
                </IonText>
              </div>

              <IonButton
                className="custom-button"
                expand="block"
                onClick={handleOverrideWinningNumber}
                style={{
                '--background': 'var(--lottery-emerald)',
                '--color': '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '700',
                height: '55px',
                marginTop: '20px',
                boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                }}
              >
                {loadingDraw ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '10px' }} />
                  Drawing...
                </>
                ) : (
                '🚀 OVERRIDE WINNING NUMBER'
                )}
              </IonButton>
              </div>
            </IonCardContent>
            </IonCard>

            <IonCard className="custom-card">
              <IonCardHeader>
                <IonCardTitle className="custom-card-title">🎟️ Members Bets</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {loadingBets ? (
                  <div className="ion-text-center">
                    <IonSpinner name="crescent" />
                  </div>
                ) : betsError ? (
                  <IonText color="danger">Error loading bets: {betsError}</IonText>
                ) : !bets || bets.length === 0 ? (
                  <IonText style={{ color: 'var(--text-color-secondary)' }}>No bets found.</IonText>
                ) : (
                  <IonList style={{ background: 'transparent' }}>
                    {bets.map((b: any, idx: number) => (
                      <IonItem key={idx} style={{ '--background': 'transparent' }}>
                        <IonLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontWeight: 700 }}>{b.member_address}</div>
                            <div style={{ color: 'var(--text-color-secondary)', fontSize: '0.95rem' }}>
                              Bet: <strong style={{ color: 'var(--lottery-gold)' }}>{b.bet_number}</strong>
                              &nbsp; • &nbsp; Draw: {b.draw_number}
                            </div>
                            <div style={{ color: 'var(--text-color-secondary)', fontSize: '0.8rem' }}>
                              {b.date ? new Date(b.date).toLocaleString() : ''}
                            </div>
                          </div>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>

            <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">💰 Add pot money</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: isAddJackpotMode
                ? '1px solid var(--lottery-gold)'
                : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
              >
              <div>
                <IonText
                style={{
                  color: isAddJackpotMode ? 'var(--lottery-gold)' : 'var(--text-color-primary)',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  display: 'block',
                }}
                >
                Add Mode
                </IonText>
                <IonText
                style={{
                  color: 'var(--text-color-secondary)',
                  fontSize: '0.85rem',
                  marginTop: '4px',
                  display: 'block',
                }}
                >
                {isAddJackpotMode ? 'Manual control enabled' : 'Standard operation'}
                </IonText>
              </div>
              <IonToggle
                mode="ios"
                checked={isAddJackpotMode}
                onIonChange={e => {
                  setIsAddJackpotMode(e.detail.checked);
                  if (e.detail.checked) setIsOverrideMode(false);
                }}
                style={{
                '--handle-background-checked': 'var(--lottery-gold)',
                '--background-checked': 'rgba(255, 215, 0, 0.2)',
                }}
              />
              </div>

              <div
              style={{
                opacity: isAddJackpotMode ? 1 : 0.5,
                pointerEvents: isAddJackpotMode ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
              }}
              >
              <IonText
                style={{
                color: 'var(--text-color-secondary)',
                fontSize: '0.9rem',
                marginBottom: '16px',
                display: 'block',
                }}
              >
                Enter the amount to be added to the lottery pot.
              </IonText>

              <IonInput
                label="Amount (USD)"
                labelPlacement="floating"
                fill="outline"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={potAmount}
                onIonChange={(e) => setPotAmount(e.detail.value ?? '')}
                helperText="Enter value in USD"
                className="custom-input"
                style={{ '--highlight-color': 'var(--lottery-gold)' }}
              >
                <IonIcon slot="start" icon={cashOutline} style={{ color: 'var(--lottery-gold)', marginRight: '8px' }}></IonIcon>
              </IonInput>

              <IonButton
                className="custom-button"
                expand="block"
                onClick={handleAddPotMoney}
                disabled={!potAmount.trim()}
                style={{
                '--background': 'var(--lottery-emerald)',
                '--color': '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '700',
                height: '55px',
                marginTop: '20px',
                boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                }}
              >
                {loadingDraw ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '10px' }} />
                  Adding...
                </>
                ) : (
                '💰 ADD POT MONEY'
                )}
              </IonButton>
              </div>
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
