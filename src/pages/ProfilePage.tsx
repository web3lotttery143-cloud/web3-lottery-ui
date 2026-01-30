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
  const { walletAddress, userProfile, disconnectWallet, walletBalance, setWalletBalance, rebate, rebate2, isAfter10Am, affiliateEarnings, affiliateEarnings2, referralUpline, setAffiliateEarnings } = useAppStore();
  const [presentToast] = useIonToast();
  const [isWalletBalanceLoading, setIsWalletBalanceLoading] = useState(false)
  const [isAffiliateEarningsLoading, setIsAffiliateEarningsLoading] = useState(false)
  const affiliateLink = `${window.location.origin}/accept-referral?ref=${walletAddress}`;

  useEffect(() => {
    if(walletBalance === null) {
      fetchBalance();
      fetchBets();
    }
  }, []); 

  useEffect(() => {
    if(!affiliateEarnings) {
      fetchBets();
    }
  }, [])

  const handleRefresh = async (event: CustomEvent) => {
		// Force refresh all data when user pulls down
		try {
			await Promise.all([
				fetchBalance(),
        fetchBets(),
			]);
		} catch (error) {
			console.error('Refresh failed:', error);
		} finally {
			event.detail.complete();
    }
  };

  const fetchBets = async () => {
    if (!walletAddress) return;
    
    try {
      setIsAffiliateEarningsLoading(true)
      let response;
      if(referralUpline !== ""){
        response = await walletService.getMemberBets(walletAddress);
      } else {
        setAffiliateEarnings(0.0000)
        return;
      }
      
      if (response.success && response.data) {
        // The API returns { ..., bets: [...] }
        const fetchedBets = response.data.bets || [];
        const successfulBets = fetchedBets.filter((b: any) => b.success === true);

        // Calculate affiliate earnings: bets count * 0.5 * 10%
     
        const calculatedEarnings = successfulBets.length * 0.5 * 0.10;
        setAffiliateEarnings(calculatedEarnings);  
      } else {
        if (!response.success) {
          setAffiliateEarnings(0.0000);
        }
      }
    } catch (err: any) {
      setAffiliateEarnings(0.0000);
    } finally {
      setIsAffiliateEarningsLoading(false)
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

            <IonCard className="custom-card" style={{ overflow: 'hidden' }}>
              <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '120px',
                background: 'linear-gradient(135deg, var(--lottery-purple) 0%, var(--lottery-emerald) 50%, var(--lottery-gold) 100%)',
                opacity: 0.3,
                filter: 'blur(40px)',
              }}
              />
              <IonCardContent
              className="ion-text-center"
              style={{ paddingTop: '30px', paddingBottom: '30px', position: 'relative' }}
              >
              <div
                style={{
                position: 'relative',
                display: 'inline-block',
                marginBottom: '16px',
                }}
              >
                <div
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  background: 'conic-gradient(from 0deg, var(--lottery-gold), var(--lottery-purple), var(--lottery-emerald), var(--lottery-gold))',
                  borderRadius: '50%',
                  animation: 'spin 3s linear infinite',
                }}
                />
                <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  background: 'var(--background-card)',
                  borderRadius: '50%',
                }}
                />
                <IonAvatar
                style={{
                  width: '110px',
                  height: '110px',
                  position: 'relative',
                  border: '3px solid var(--lottery-gold)',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(106, 13, 173, 0.3)',
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
              </div>

              <div style={{ position: 'relative' }}>
                <h2
                style={{
                  background: 'linear-gradient(90deg, var(--lottery-gold), #fff, var(--lottery-gold))',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800',
                  margin: '16px 0 8px 0',
                  fontSize: '1.6rem',
                  letterSpacing: '0.5px',
                  textShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
                }}
                >
                {userProfile?.username || 'Anonymous Player'}
                </h2>
                <IonBadge
                style={{
                  background: 'linear-gradient(135deg, var(--lottery-purple), var(--lottery-emerald))',
                  color: '#fff',
                  padding: '6px 16px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 15px rgba(106, 13, 173, 0.4)',
                }}
                >
                ⭐ ACTIVE PLAYER 
                </IonBadge>
              </div>

              <div
                onClick={() => handleCopy(walletAddress || '')}
                style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '12px',
                padding: '14px 20px',
                margin: '20px 16px 0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                }}
              >
                <p
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--lottery-gold)',
                  fontSize: '0.95rem',
                  wordBreak: 'break-all',
                  margin: '0',
                  fontWeight: '600',
                }}
                >
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                </p>
                <IonIcon icon={copyOutline} style={{ color: 'var(--lottery-gold)', fontSize: '1rem' }} />
              </div>

              {referralUpline && (
                <div
                style={{
                  background: 'linear-gradient(135deg, rgba(106, 13, 173, 0.2), rgba(16, 185, 129, 0.1))',
                  border: '1px solid rgba(106, 13, 173, 0.4)',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  margin: '12px 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                >
                <span style={{ fontSize: '1.2rem' }}>🤝</span>
                <p
                  style={{
                  fontFamily: 'monospace',
                  color: 'var(--lottery-purple)',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all',
                  margin: '0',
                  fontWeight: '600',
                  }}
                >
                  Referred by: {referralUpline.slice(0, 6)}...{referralUpline.slice(-4)}
                </p>
                </div>
              )}
              </IonCardContent>
              <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              `}</style>
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
                    ${isAfter10Am ? (rebate2 || '0') : (rebate || '0')}
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
                    {isAffiliateEarningsLoading ? (
                      <IonSpinner name="crescent" color="dark" style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      `$${affiliateEarnings.toFixed(4) || 0.0000}`
                    )}
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
