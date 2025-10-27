import { useMutation } from '@apollo/client';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  useIonLoading,
  useIonToast,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { REGISTER_USER } from '../graphql/queries';
import useAppStore from '../store/useAppStore';

const ReferralAcceptPage: React.FC = () => {
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string>('');
  const [presentToast] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  const [registerUser, { data, loading }] = useMutation(REGISTER_USER);

  const { connectWallet, setUserProfile } = useAppStore();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      console.log('Referrer found in URL:', ref);
      setReferrerAddress(ref);
    } else {
      console.error('No referrer address found in URL.');
      presentToast({
        message: 'Error: No referrer specified in the link.',
        duration: 3000,
        color: 'danger',
      });
    }
  }, [presentToast]);

  const handleRegister = async () => {
    if (!referrerAddress) {
      presentToast({ message: 'Referrer address is missing.', duration: 2000, color: 'danger' });
      return;
    }
    if (!userWalletAddress || userWalletAddress.trim().length < 42) {
      presentToast({
        message: 'Please paste a valid wallet address.',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    await presentLoading({ message: 'Registering...' });

    try {
      await registerUser({
        variables: {
          walletAddress: userWalletAddress.trim().toLowerCase(),
          referrer: referrerAddress.toLowerCase(),
        },
      });
    } catch (error: any) {
      dismissLoading();
      presentToast({
        message: error.message || 'Registration failed.',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  useEffect(() => {
    if (loading) return;

    if (data && data.registerUser) {
      dismissLoading();

      presentToast({
        message: 'Registration successful! Redirecting...',
        duration: 2000,
        color: 'success',
      });
      setUserWalletAddress('');

      connectWallet(data.registerUser.walletAddress);
      setUserProfile(data.registerUser);

      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } else if (!loading) {
      dismissLoading();
    }
  }, [loading, data, dismissLoading, presentToast, connectWallet, setUserProfile]);

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>🤝 Accept Referral</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="fade-in ion-text-center" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Logo />
          <h1 style={{ color: 'var(--lottery-gold)', fontWeight: 800 }}>Join the Lottery</h1>

          {referrerAddress ? (
            <IonCard className="custom-card">
              <IonCardHeader>
                <IonCardTitle className="custom-card-title">You were referred by:</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText
                  style={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: 'var(--text-color-secondary)',
                  }}
                >
                  {referrerAddress}
                </IonText>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonText color="danger">
              <h2>Invalid Referral Link</h2>
              <p>Please use a valid link provided by a referrer.</p>
            </IonText>
          )}

          {referrerAddress && (
            <>
              <IonCard className="custom-card">
                <IonCardHeader>
                  <IonCardTitle className="custom-card-title">
                    Enter Your Wallet Address
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList style={{ background: 'transparent' }}>
                    <IonItem
                      lines="none"
                      style={{
                        '--background': 'rgba(255,255,255,0.05)',
                        '--min-height': '60px',
                        borderRadius: 'var(--border-radius)',
                        '--padding-start': '16px',
                        '--padding-end': '16px',
                      }}
                    >
                      <IonInput
                        placeholder="Paste your wallet address here"
                        value={userWalletAddress}
                        onIonInput={e => setUserWalletAddress(e.detail.value!)}
                        clearInput
                        style={{ color: 'var(--text-color)' }}
                      />
                    </IonItem>
                  </IonList>

                  <IonButton
                    className="custom-button"
                    expand="block"
                    onClick={handleRegister}
                    disabled={loading || !referrerAddress}
                    style={{ marginTop: '24px' }}
                  >
                    {loading ? 'Registering...' : 'Accept & Register'}
                  </IonButton>
                </IonCardContent>
              </IonCard>

              <IonCard className="custom-card">
                <IonCardHeader>
                  <h3
                    style={{
                      color: 'var(--lottery-gold)',
                      fontWeight: 700,
                      margin: '0',
                      fontSize: '1.2rem',
                      borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
                      paddingBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    📜 Terms & Conditions
                  </h3>
                </IonCardHeader>
                <IonCardContent>
                  <dl style={{ margin: 0, padding: 0, fontSize: '0.9rem', textAlign: 'left' }}>
                    <dt
                      style={{
                        color: 'var(--lottery-gold)',
                        fontWeight: '700',
                        margin: '8px 0 4px 0',
                      }}
                    >
                      Affiliate Bonus:
                    </dt>
                    <dd style={{ margin: '0 0 12px 0', color: 'var(--text-color-secondary)' }}>
                      You'll earn 10% from all bets made by the people you refer (your affiliates).
                    </dd>
                    <dt
                      style={{
                        color: 'var(--lottery-gold)',
                        fontWeight: '700',
                        margin: '8px 0 4px 0',
                      }}
                    >
                      Bet Rebate:
                    </dt>
                    <dd style={{ margin: '0 0 12px 0', color: 'var(--text-color-secondary)' }}>
                      You'll get a 10% rebate back on every bet you place.
                    </dd>
                    <dt
                      style={{
                        color: 'var(--lottery-gold)',
                        fontWeight: '700',
                        margin: '8px 0 4px 0',
                      }}
                    >
                      Jackpot Affiliate Reward:
                    </dt>
                    <dd style={{ margin: '0 0 12px 0', color: 'var(--text-color-secondary)' }}>
                      If one of your affiliates wins the jackpot, you'll receive 5% of the jackpot
                      prize as a reward.
                    </dd>
                    <dt
                      style={{
                        color: 'var(--lottery-gold)',
                        fontWeight: '700',
                        margin: '8px 0 4px 0',
                      }}
                    >
                      Transparency & On-Chain Tracking:
                    </dt>
                    <dd style={{ margin: '0 0 12px 0', color: 'var(--text-color-secondary)' }}>
                      All transactions, bets, and rewards are recorded on-chain for full
                      transparency.
                    </dd>
                    <dt
                      style={{
                        color: 'var(--lottery-gold)',
                        fontWeight: '700',
                        margin: '8px 0 4px 0',
                      }}
                    >
                      Fair Play:
                    </dt>
                    <dd style={{ margin: '0', color: 'var(--text-color-secondary)' }}>
                      Once a bet is placed, it cannot be changed or refunded.
                    </dd>
                  </dl>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReferralAcceptPage;
