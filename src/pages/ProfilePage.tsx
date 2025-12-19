import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonSpinner,
  useIonToast,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import {
  cardOutline,
  cashOutline,
  copyOutline,
  giftOutline,
  logOutOutline,
  trophyOutline,
} from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import walletService from '../services/walletService';

const ProfilePage: React.FC = () => {
  const { walletAddress, userProfile, disconnectWallet, walletBalance, setWalletBalance } = useAppStore();
  const [presentToast] = useIonToast();
  const [isWalletBalanceLoading, setIsWalletBalanceLoading] = useState(false)
  const affiliateLink = `${window.location.origin}/accept-referral?ref=${walletAddress}`;

  useEffect(() => {
    if(walletBalance === null) {
      fetchBalance();
    }
  }, []); 

  const handleRefresh = async (event: CustomEvent) => {
		// Force refresh all data when user pulls down
		try {
			await Promise.all([
				fetchBalance(),
			]);
		} catch (error) {
			console.error('Refresh failed:', error);
		} finally {
			event.detail.complete();
    }
  };

  const fetchBalance = async () => {
    try {
      setIsWalletBalanceLoading(true)
      const res = await walletService.getBalance(walletAddress ?? '')

    setWalletBalance(res ?? '')

    } catch (error) {
      presentToast({
      message: `${error}`,
      duration: 1500,
      color: 'error',
    });
    } finally {
      setIsWalletBalanceLoading(false)
    }
    
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    presentToast({
      message: 'Copied to clipboard!',
      duration: 1500,
      color: 'success',
    });
  };

  const handleDisconnect = () => {
    disconnectWallet();
    presentToast({
      message: 'Wallet disconnected',
      duration: 2000,
      color: 'success',
    });
  };

  const fallbackAvatar = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${
    walletAddress || 'default'
  }`;

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>Player Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher
                  slot="fixed"
                  onIonRefresh={handleRefresh}
                >
                  <IonRefresherContent></IonRefresherContent>
                    </IonRefresher>
        
        <div className="fade-in">

          <IonCard className="custom-card">
            <IonCardContent
              className="ion-text-center"
              style={{ paddingTop: '30px', paddingBottom: '30px' }}
            >
              <IonAvatar
                style={{
                  width: '90px',
                  height: '90px',
                  margin: '0 auto 16px',
                  border: '4px solid var(--lottery-gold)',
                }}
              >
                <img
                  src={userProfile?.profileImageUrl || fallbackAvatar}
                  alt="Profile Avatar"
                  onError={e => {
                    e.currentTarget.src = fallbackAvatar;
                  }}
                />
              </IonAvatar>
              <h2 style={{ color: 'var(--lottery-gold)', fontWeight: '700', margin: '0 0 4px 0' }}>
                {userProfile?.username || 'Anonymous Player'}
              </h2>
              <p
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--text-color-secondary)',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                  padding: '0 16px',
                }}
              >
                {walletAddress}
              </p>
            </IonCardContent>
          </IonCard>

          <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">💳 Your Wallet Balance</IonCardTitle>
            </IonCardHeader>
            <IonCardContent style={{ padding: '0' }}>
              <IonList lines="full" style={{ background: 'transparent', padding: '0' }}>
                <IonItem
                  style={
                    {
                      '--background': 'transparent',
                      '--border-color': 'rgba(255, 215, 0, 0.2)',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                    } as any
                  }
                >
                  <IonIcon
                    icon={cardOutline}
                    slot="start"
                    style={{ color: 'var(--lottery-emerald)' }}
                  />
                  <IonLabel>
                    <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      Wallet Balance
                    </IonText>
                  </IonLabel>
                  <IonBadge
                    slot="end"
                    style={{
                      background: 'var(--lottery-emerald)',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      padding: '6px 10px',
                    }}
                  >
                    {isWalletBalanceLoading ? (
                        <IonSpinner name="crescent" color="light" style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        `$${walletBalance}`
                      )}
                  </IonBadge>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">💰 Your Earnings</IonCardTitle>
            </IonCardHeader>
            <IonCardContent style={{ padding: '0' }}>
              <IonList lines="full" style={{ background: 'transparent', padding: '0' }}>
                <IonItem
                  style={
                    {
                      '--background': 'transparent',
                      '--border-color': 'rgba(255, 215, 0, 0.2)',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                    } as any
                  }
                >
                  <IonIcon
                    icon={giftOutline}
                    slot="start"
                    style={{ color: 'var(--lottery-emerald)' }}
                  />
                  <IonLabel>
                    <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      Total Rebates Earned
                    </IonText>
                  </IonLabel>
                  <IonBadge
                    slot="end"
                    style={{
                      background: 'var(--lottery-emerald)',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      padding: '6px 10px',
                    }}
                  >
                    ${(userProfile?.totalRebates || 0).toFixed(2)}
                  </IonBadge>
                </IonItem>
                <IonItem
                  style={
                    {
                      '--background': 'transparent',
                      '--border-color': 'rgba(255, 215, 0, 0.2)',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                    } as any
                  }
                >
                  <IonIcon
                    icon={cashOutline}
                    slot="start"
                    style={{ color: 'var(--lottery-gold)' }}
                  />
                  <IonLabel>
                    <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      Affiliate Earnings
                    </IonText>
                  </IonLabel>
                  <IonBadge
                    slot="end"
                    style={{
                      background: 'var(--gold-gradient)',
                      color: '#000000',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      padding: '6px 10px',
                    }}
                  >
                    ${(userProfile?.totalAffiliateEarnings || 0).toFixed(2)}
                  </IonBadge>
                </IonItem>
                <IonItem
                  style={
                    {
                      '--background': 'transparent',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                    } as any
                  }
                >
                  <IonIcon
                    icon={trophyOutline}
                    slot="start"
                    style={{ color: 'var(--lottery-purple)' }}
                  />
                  <IonLabel>
                    <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      Player Status
                    </IonText>
                  </IonLabel>
                  <IonBadge
                    slot="end"
                    style={{
                      background: 'var(--lottery-purple)',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                    }}
                  >
                    ACTIVE PLAYER
                  </IonBadge>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          <IonCard className="custom-card">
            <IonCardHeader>
              <IonCardTitle className="custom-card-title">👥 Refer & Earn</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div
                style={{
                  background: 'rgba(106, 13, 173, 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid rgba(106, 13, 173, 0.3)',
                }}
              >
                <IonText
                  style={{ color: 'var(--lottery-purple)', fontWeight: '600', fontSize: '0.9rem' }}
                >
                  💰 Earn 10% commission on every ticket your referrals purchase!
                </IonText>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                }}
              >
                <IonText
                  style={{
                    wordWrap: 'break-word',
                    color: 'var(--text-color-secondary)',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {affiliateLink}
                </IonText>
              </div>

              <IonButton
                className="custom-button"
                expand="block"
                onClick={() => handleCopy(affiliateLink)}
                style={
                  {
                    '--background': 'var(--lottery-purple)',
                    '--color': '#ffffff',
                    '--background-activated': 'var(--lottery-purple)',
                    '--background-hover': 'var(--lottery-purple)',
                  } as any
                }
              >
                <IonIcon slot="start" icon={copyOutline} />
                Copy Referral Link
              </IonButton>
            </IonCardContent>
          </IonCard>

          <div style={{ padding: '0 16px', marginTop: '24px', marginBottom: '32px' }}>
            <IonButton
              className="custom-button"
              expand="block"
              onClick={handleDisconnect}
              style={
                {
                  '--background': 'var(--lottery-crimson)',
                  '--color': '#ffffff',
                  '--background-activated': 'var(--lottery-crimson)',
                  '--background-hover': 'var(--lottery-crimson)',
                } as any
              }
            >
              <IonIcon slot="start" icon={logOutOutline} />
              Disconnect Wallet
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
