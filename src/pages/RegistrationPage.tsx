import { useMutation } from '@apollo/client';
import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRadio,
  IonRadioGroup,
  IonModal,
  IonPage,
  IonRow,
  IonText,
  useIonLoading,
  useIonToast,
  useIonRouter,
  IonFooter,
} from '@ionic/react';
import { clipboardOutline, walletOutline, checkmarkCircle } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { REGISTER_USER } from '../graphql/queries';
import xteriumService from '../services/xteriumService';
import useAppStore from '../store/useAppStore';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import walletService from '../services/walletService';

const ADMIN_WALLET = import.meta.env.VITE_OPERATOR_WALLET_ADDRESS?.toLowerCase();

const RegistrationPage: React.FC = () => {
  const router = useIonRouter();
  const { connectWallet, setUserProfile, setIsAdmin, loginState, setLoginState, setReferralUpline, setAvailableWallets: setStoreAvailableWallets } = useAppStore();
  const [present, dismiss] = useIonLoading();
  const [presentToast] = useIonToast();
  const [registerUser] = useMutation(REGISTER_USER); 
  const [confirmationModal, setConfirmationModal] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState('')
  const [availableWallets, setAvailableWallets] = useState<{ address: string; label: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const [detectedWallet, setDetectedWallet] = useState<string | null>(null);



  const handleSubmit = async () => { 
    await present({message: 'Please wait...'})
    try {
        const walletsToRegister = availableWallets.length > 0 ? availableWallets.map(w => w.address) : connectedWallet;
        const response = await walletService.registerWallet(walletsToRegister)     
      if(!response.success) {
        throw new Error(response.message)
      }

      let upline = response.data;
      if (Array.isArray(response.data)) {
        const index = availableWallets.findIndex(w => w.address === connectedWallet);
        upline = response.data[index !== -1 ? index : 0];
      }

      if(response.message === 'Operator Connected...') {
        setIsAdmin(true)
        presentToast({ message: response.message, duration: 2000, color: 'success'})
        connectWallet(connectedWallet)
        setStoreAvailableWallets(availableWallets)
        setReferralUpline(upline)
        router.push('/dashboard', 'root', 'replace');
      } else {
        setReferralUpline(upline)
        presentToast({ message: response.message, duration: 2000, color: 'success'})
        connectWallet(connectedWallet)
        setStoreAvailableWallets(availableWallets)
        router.push('/dashboard', 'root', 'replace');
      }    
    } catch (error) {
      presentToast({ message: `${error}`, duration: 2000, color: 'danger' });                                     
    } finally {
      setConfirmationModal(false)
      setDetectedWallet(null)
      setLoginState(false)
      await dismiss()
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    		
  } 

  useEffect(() => {
    const fetchWallets = async () => {
      const wallets = await walletService.checkWalletsFromUrl();

      if (wallets) {
        setConfirmationModal(true)
        let walletList: any[] = [];
        
        if (Array.isArray(wallets)) {
            walletList = wallets;
        } else {
            walletList = [wallets];
        }

        const processedWallets = walletList.map(w => {
            if (typeof w === 'string') return { address: w, label: w };
            const address = w.address || (typeof w === 'string' ? w : JSON.stringify(w));
            const label = w.name || w.meta?.name || address;
            return { address, label };
        });

        setAvailableWallets(processedWallets);

        if (processedWallets.length > 0) {
             const firstWallet = processedWallets[0].address;
             setDetectedWallet(firstWallet);
             setConnectedWallet(firstWallet)     
        }
      }
    };

    fetchWallets();
  }, []);

  const handleOpenXterium = () => {
    const callbackUrl = encodeURIComponent(window.location.href);
    const deeplink = `https://deeplink.xterium.app/web3/approval?callbackUrl=${callbackUrl}&chainId=3417`;
    
    // Attempt: window.open with _self target
    window.open(deeplink, '_self');
  }

  const  handleLogin = async () => {
    setLoginState(true)
    handleOpenXterium()
  }

  const handleCancel = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setConfirmationModal(false)
    setLoginState(false)
  }
  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <IonGrid style={{ height: '100%' }}>
          <IonRow
            className="ion-justify-content-center ion-align-items-center"
            style={{ height: '100%' }}
          >
            <IonCol size="12" size-md="6" size-lg="4" className="ion-text-center">
              <Logo />
              <IonText color="primary">
                <h1
                  style={{
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '2rem',
                  }}
                >
                  WEB3 LOTTERY
                </h1>
              </IonText>
              <IonText>
                <p
                  style={{
                    color: 'var(--text-color-secondary)',
                    fontSize: '1.1rem',
                  }}
                >
                  🎰 The most transparent and fair lottery on the blockchain
                </p>
              </IonText>

              <IonButton
                expand="block"
                onClick={handleOpenXterium}
                className="custom-button"
                style={{
                  marginTop: '12px',
                  height: '50px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                }}
              >
                🚀 Login & Start Playing
              </IonButton>

              {/* <IonItem lines="none" className="divider-item">
                  <div className="divider">
                    <span className="line"></span>
                    <IonText color="medium" className="text">
                      Or
                    </IonText>
                    <span className="line"></span>
                  </div>
              </IonItem> */}

              {/* <IonButton
                expand="block"
                onClick={handleLogin}
                className="custom-button"
                style={
                  {
                    marginTop: '12px',
                    height: '50px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    '--background': 'var(--lottery-purple)',
                    '--color': '#ffffff',
                  } as any
                }
              >
                Login
              </IonButton> */}
              
              <div
                style={{
                  background: 'var(--card-background-color)',
                  borderRadius: '16px',
                  padding: '20px',
                  margin: '24px 0',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  textAlign: 'left',
                }}
              >
                <IonText>
                  <h3
                    style={{
                      color: 'var(--lottery-gold)',
                      fontWeight: 700,
                      margin: '0 0 16px 0',
                      fontSize: '1.2rem',
                      borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
                      paddingBottom: '8px',
                      textAlign: 'center',
                    }}
                  >
                    Terms:
                  </h3>
                </IonText>
                <dl style={{ margin: 0, padding: 0, fontSize: '0.9rem' }}>
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
                    All transactions, bets, and rewards are recorded on-chain for full transparency.
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
              </div>

              <IonText>
                <p
                  style={{
                    color: 'var(--text-color-secondary)',
                    fontSize: '0.9rem',
                    marginTop: '20px',
                  }}
                >
                  By connecting, you agree to our Terms of Service
                </p>
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonModal
          isOpen={confirmationModal}
          onDidDismiss={() => setConfirmationModal(false)}
          initialBreakpoint={1}
          breakpoints={[0, 1]}
        >
          <IonContent
            className="ion-padding"
            style={{
              "--background": "var(--background-color)",
            }}
          >
            <div
              style={{
          textAlign: "center",
          padding: "24px 16px",
              }}
            >
              <div
          style={{
            fontSize: "3rem",
            marginBottom: "16px",
          }}
              >
          {loginState ? "🔐" : "🎉"}
              </div>
              
              <h2
          style={{
            color: "var(--lottery-gold)",
            fontWeight: 700,
            fontSize: "1.5rem",
            marginBottom: "8px",
          }}
              >
          {loginState ? "Welcome Back!" : "Registration Confirmed"}
              </h2>
              
              <p
          style={{
            color: "var(--text-color-secondary)",
            fontSize: "0.95rem",
            marginBottom: "24px",
          }}
              >
          {loginState
            ? "Please confirm your wallet to login"
            : "Please confirm your wallet to complete registration"}
              </p>

              {availableWallets.length > 1 ? (
                <div style={{ textAlign: "left", marginBottom: "24px" }}>
                  <p
                    style={{
                      color: "var(--text-color-secondary)",
                      fontSize: "0.9rem",
                      marginBottom: "12px",
                      fontWeight: 500,
                      textAlign: "center",
                      letterSpacing: "0.5px"
                    }}
                  >
                    Select Wallet to Connect:
                  </p>
                  <IonList style={{ background: 'transparent', padding: 0 }}>
                    <IonRadioGroup value={connectedWallet} onIonChange={e => setConnectedWallet(e.detail.value)}>
                      {availableWallets.map((wallet, index) => {
                        const isSelected = connectedWallet === wallet.address;
                        return (
                          <IonItem 
                            key={index} 
                            lines="none" 
                            style={{ 
                              '--background': isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                              marginBottom: '10px', 
                              borderRadius: '12px', 
                              border: isSelected ? '1px solid var(--lottery-gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                              transition: 'all 0.3s ease',
                              '--padding-start': '12px',
                              '--inner-padding-end': '12px'
                            }}
                          >
                            <IonRadio slot="start" value={wallet.address} style={{ marginInlineEnd: '16px', '--color-checked': 'var(--lottery-gold)' }} />
                            <IonIcon icon={walletOutline} slot="start" style={{ color: isSelected ? 'var(--lottery-gold)' : 'var(--text-color-secondary)', marginRight: '12px' }} />
                            <IonLabel style={{ margin: '12px 0' }}>
                              <h3 style={{ 
                                color: isSelected ? 'var(--lottery-gold)' : 'var(--ion-color-light)',
                                fontWeight: isSelected ? '700' : '500', 
                                fontSize: '1rem',
                                marginBottom: '4px' 
                              }}>
                                {wallet.label}
                              </h3>
                              <p style={{ 
                                fontSize: '0.85rem', 
                                opacity: 0.8,
                                fontFamily: 'monospace',
                                color: 'var(--text-color-secondary)'
                              }}>
                                {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 6)}
                              </p>
                            </IonLabel>
                            {isSelected && (
                              <IonIcon icon={checkmarkCircle} slot="end" style={{ color: 'var(--lottery-gold)' }} />
                            )}
                          </IonItem>
                        );
                      })}
                    </IonRadioGroup>
                  </IonList>
                </div>
              ) : (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.02) 100%)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "1px solid rgba(255, 215, 0, 0.3)",
                    marginBottom: "24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{ 
                    background: 'rgba(255, 215, 0, 0.2)', 
                    borderRadius: '50%', 
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <IonIcon icon={walletOutline} style={{ fontSize: '24px', color: 'var(--lottery-gold)' }} />
                  </div>
                  <p
                    style={{
                      color: "var(--text-color-secondary)",
                      fontSize: "0.9rem",
                      marginBottom: "8px",
                      fontWeight: 500,
                    }}
                  >
                    Connected Wallet
                  </p>
                  <p
                    style={{
                      color: "var(--lottery-gold)",
                      fontSize: "1.1rem",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      textAlign: "center"
                    }}
                  >
                    {connectedWallet}
                  </p>
                </div>
              )}
            </div>
          </IonContent>
          
          <IonFooter>
            <div
              style={{
            display: "flex",
            gap: "12px",
            padding: "16px",
            background: "var(--background-color)",
              }}
            >
              <IonButton
              fill="solid"
              expand="block"
              onClick={handleCancel}
              style={{
          flex: 1,
          "--background": "var(--lottery-crimson)",
          "--color": "#000000",
          "--border-color": "transparent",
              } as any}
          >
              Cancel
              </IonButton>
              
              <IonButton
          className="custom-button"
          expand="block"
          onClick={handleSubmit}
          style={{
            flex: 1,
            "--background": "linear-gradient(135deg, var(--lottery-emerald), #10b981)",
            fontWeight: 700,
          }}
              >
          {loginState ? "Login" : "Complete Registration"} ✓
              </IonButton>
            </div>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default RegistrationPage;