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
  IonModal,
  IonFooter,
  useIonRouter
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { REGISTER_USER } from '../graphql/queries';
import useAppStore from '../store/useAppStore';
import walletService from '../services/walletService';

const ReferralAcceptPage: React.FC = () => {
  const router = useIonRouter();
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string>('');
  const [presentToast] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  const [registerUser, { data, loading }] = useMutation(REGISTER_USER);
  const [confirmationModal, setConfirmationModal] = useState(false)
  const [detectedWallet, setDetectedWallet] = useState<string | null>(null);
  

  const { connectWallet, setUserProfile, referralUpline, setReferralUpline } = useAppStore();
  
  const handleOpen = () => {
    const callbackUrl = encodeURIComponent(window.location.href);
    const deeplink = `xterium://app/web3/approval?callback=${callbackUrl}&chainId=3417`;
    window.open(deeplink, '_self');
    setReferralUpline(referrerAddress!)
  }

  const handleSubmit = async () => {
    try {
      await presentLoading({message: 'Wait'})
      const response = await walletService.registerWallet(detectedWallet!, referralUpline!)

      if (!response.success){
        throw new Error(response.message)
        
      }

      presentToast({ message: response.message, duration: 2000, color: 'success'})
      connectWallet(detectedWallet!)
      router.push('/dashboard', 'root', 'replace');
    } catch (error) {
      presentToast({ message: `${error}`, duration: 2000, color: 'danger', });               
    } finally {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");

      if (ref && ref.includes("?")) {
        const actualRef = ref.split("?")[0];
        url.searchParams.set("ref", actualRef);
        window.history.replaceState({}, "", url.toString());
      }
      setConfirmationModal(false)
      dismissLoading() 
         
    }
  }

  useEffect(() => {
      const fetchWallets = async () => {
        const params = new URLSearchParams(window.location.search)
        const ref = params.get('ref')

        const normalizeSearch = true
        const wallets = await walletService.checkWalletsFromUrl(normalizeSearch);   
          
  
        if (wallets) {
          setConfirmationModal(true)
          setReferrerAddress(ref)
          let firstWallet = '';
          let walletList = '';
          if (Array.isArray(wallets)) {
            firstWallet = typeof wallets[0] === 'string' ? wallets[0] : (wallets[0]?.address ?? '');
            walletList = wallets
              .map(w => (typeof w === 'string' ? w : w.address ?? JSON.stringify(w)))
              .join(', ');
          } else if (typeof wallets === 'object') {
            firstWallet = (wallets as any).address ?? '';
            walletList = JSON.stringify(wallets);
          } else {
            firstWallet = String(wallets);
            walletList = String(wallets);
          }
  
          if (firstWallet) {
               setDetectedWallet(firstWallet);  
          } else {
               presentToast({
                  message: `Connected wallets: ${walletList}`,
                  duration: 2000,
                  color: 'success',
               });
               
          }
        } else {
          if(ref) {
            setReferrerAddress(ref)
          }
          presentToast({
                  message: `No wallets detected`,
                  duration: 2000,
                  color: 'danger',
               });
        }
      };
  
      fetchWallets();
    }, []);
  
 
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
                    🚀 Register & Start Playing
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton
                    className="custom-button"
                    expand="block"
                    onClick={handleOpen}
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

        <IonModal
                          isOpen={confirmationModal}
                          onDidDismiss={() => setConfirmationModal(false)}
                          initialBreakpoint={1}
                        >
                          <IonContent
                            className="ion-padding"
                            style={{
                              "--background": "var(--background-color)",
                            }}
                          >
                
                            <div style={{ padding: "8px" }}>
                              <h2 style={{ color: "var(--lottery-gold)" }}>
                               Confirm Registration
                              </h2>
                            </div>
                            <p style={{ color: "var(--lottery-gold)" }}>First wallet: {detectedWallet}</p> 
                            <p style={{ color: "var(--lottery-gold)" }}>Referrer: {referralUpline}</p> 
                          </IonContent>
                          <IonFooter>
                                <div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)",}}>
                      
                                  <IonButton
                                    className="custom-button"
                                    expand="block"
                                    onClick={handleSubmit}
                                    style={{
                                      flex: 1,
                                      "--background": "var(--lottery-emerald)",
                                    }}
                                  >
                                  Confirm
                                  </IonButton>
                                </div>
                          </IonFooter>
        
                </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ReferralAcceptPage;
