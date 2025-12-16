import { useMutation } from '@apollo/client';
import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonPage,
  IonRow,
  IonText,
  useIonLoading,
  useIonToast,
  useIonRouter,
  IonFooter,
} from '@ionic/react';
import { clipboardOutline } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { REGISTER_USER } from '../graphql/queries';
import xteriumService from '../services/xteriumService';
import useAppStore from '../store/useAppStore';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import walletService from '../services/walletService';

const ADMIN_WALLET = import.meta.env.VITE_OPERATOR_WALLET_ADDRESS?.toLowerCase();
interface XteriumConnectButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const RegistrationPage: React.FC = () => {

// const openXteriumApp = () => {
//     const tg = window.Telegram?.WebApp;
    
//     if (!tg) {
//       const errorMsg = 'Telegram WebApp API is not available';
//       presentToast({ message: `${errorMsg}`, duration: 2000, color: 'warning' });
     
//       return;
//     }

//     try {
//       // Replace with actual Xterium deep link
//       const callbackUrl = encodeURIComponent(window.location.href);
//       const xteriumDeepLink = `xterium://app/web3/approval?callback=${callbackUrl}&chainId=3417`;
      
//       // Trigger haptic feedback for better UX
//       tg.HapticFeedback?.impactOccurred('medium');
      
//       // Open the app
//       tg.openLink(xteriumDeepLink, { try_instant_view: false });
      
//       console.log('Attempted to open Xterium app');
//       presentToast({ message: `Attempted to open Xterium app`, duration: 2000, color: 'warning' });
      
//       // Handle success - optional
//       // You can show a toast or perform other actions
      
//     } catch (error) {
//       const errorMsg = `Error opening Xterium app: ${error}`;
//       presentToast({ message: `${errorMsg}`, duration: 2000, color: 'danger' });
//     }
//   };

  const openXteriumApp = () => {
  const tg = window.Telegram?.WebApp;
  
  // (Omitted the initial tg check and error handling for brevity)
  // ...

  try {
    const callbackUrl = encodeURIComponent('https://t.me/Loters12345_bot/httpsweb3lotteryuiblockspa');
    const xteriumDeepLink = `xterium://app/web3/approval?callback=${callbackUrl}&chainId=3417`;
    if (!tg) {

    presentToast({ message: 'Telegram WebApp API is not available', duration: 2000, color: 'warning' });

    return;

}
    
    // 1. (Optional) Run Haptic Feedback before navigating away
    tg.HapticFeedback?.impactOccurred('medium'); 

    // 2. **CRITICAL CHANGE:** Use direct browser navigation for the deep link.
    // This correctly triggers the external app without triggering the 
    // "webapptgurl invalid" error from tg.openLink().
    window.location.href = xteriumDeepLink;
    
  } catch (error) {
    console.error('Error opening Xterium app:', error);
    presentToast({ message: `Error: ${error}`, duration: 2000, color: 'danger' });
  }
};

//   const openXteriumApp = () => {
//   const tg = window.Telegram?.WebApp;
  
//   if (!tg) {
//     presentToast({ message: 'Telegram WebApp API is not available', duration: 2000, color: 'warning' });
//     return;
//   }

//   try {
//     const callbackUrl = encodeURIComponent('https://t.me/Loters12345_bot/httpsweb3lotteryuiblockspa');
//     const xteriumDeepLink = `xterium://app/web3/approval?callback=${callbackUrl}&chainId=3417`;
    
//     console.log('Opening Xterium with:', xteriumDeepLink);
    
//     if(window.Telegram && window.Telegram.WebApp){
//       tg.openLink(xteriumDeepLink)
//     } else {
//       presentToast({ message: 'window is not telegram and window.telegram.webApp. using direct link instead', duration: 5000, color: 'warning' });
//       window.location.href = xteriumDeepLink
//     }
    
//     tg.HapticFeedback?.impactOccurred('medium');
    
//   } catch (error) {
//     console.error('Error opening Xterium app:', error);
//     presentToast({ message: `Error: ${error}`, duration: 2000, color: 'danger' });
//   }
// };

  const router = useIonRouter();
  const { connectWallet, setUserProfile, setIsAdmin, loginState, setLoginState, setReferralUpline } = useAppStore();
  const [present, dismiss] = useIonLoading();
  const [presentToast] = useIonToast();
  const [registerUser] = useMutation(REGISTER_USER); 
  const [confirmationModal, setConfirmationModal] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const [detectedWallet, setDetectedWallet] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setWalletInput(text.trim());
      } else {
        presentToast({ message: 'Clipboard is empty.', duration: 2000, color: 'warning' });
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      presentToast({
        message: 'Could not read from clipboard. Please paste manually.',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleManualRegister = async () => {
    if (walletInput.trim().length < 42) {
      presentToast({
        message: 'Please enter a valid wallet address.',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
        await present({ message: 'Registering...' });
        const response = await walletService.registerWallet(walletInput.trim());
        
        dismiss();
        presentToast({
          message: 'Registration successful! Logging in...',
          duration: 2000,
          color: 'success',
        });
        
        connectWallet(walletInput.trim());
        if (response) {
            // setUserProfile(response);
        }
        
        setIsModalOpen(false);
        setWalletInput('');
        router.push('/dashboard');

    } catch (error: any) {
      dismiss();
      console.error(error);
      presentToast({ message: error.message || 'Registration failed', duration: 3000, color: 'danger' });
    }
  };

  const handleConnect = async (asAdmin: boolean) => {
    const loadingMessage = asAdmin ? 'Connecting admin wallet...' : 'Connecting wallet...';
    await present({ message: loadingMessage });
    try {
      const { walletAddress } = await xteriumService.connectAdmin();
      const { data } = await registerUser({ variables: { walletAddress } });
      console.log('Admin registered:', data);

      if (walletAddress.toLowerCase() === ADMIN_WALLET) {
        console.log('Admin wallet detected');
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        presentToast({
          message: 'Connected wallet is not the designated operator.',
          duration: 3000,
          color: 'warning',
        });
      }

      if (data?.registerUser) {
        connectWallet(walletAddress);
        setUserProfile(data.registerUser);
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      presentToast({
        message: error.message || 'Failed to connect wallet',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      dismiss();
    }
  };

  const handleSubmit = async () => { 
    await present({message: 'Please wait...'})
    try {
      let response;
      if(loginState)
      {
        response = await walletService.loginWallet(connectedWallet);
      } else {
        response = await walletService.registerWallet(connectedWallet)
      }

      if(!response.success) {
        throw new Error(response.message)
      }

      if(response.data === 'Admin') {
        setIsAdmin(true)
        presentToast({ message: response.message, duration: 2000, color: 'success'})
        connectWallet(connectedWallet)
        router.push('/dashboard', 'root', 'replace');
      } else {
        setReferralUpline(response.data)
        presentToast({ message: response.message, duration: 2000, color: 'success'})
        connectWallet(connectedWallet)
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
             setConnectedWallet(firstWallet)     
        } else {
             presentToast({
                message: `Connected wallets: ${walletList}`,
                duration: 2000,
                color: 'success',
             });
        }
      }
    };

    fetchWallets();
  }, []);

 

  const handleOpenXterium = () => {
    const callbackUrl = encodeURIComponent(window.location.href);
    const deeplink = `xterium://app/web3/approval?callback=${callbackUrl}&chainId=3417`;
    
    // Attempt: window.open with _self target
    window.open(deeplink, '_self');
  }

  const  handleLogin = async () => {
    setLoginState(true)
    handleOpenXterium()
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
                🚀 Register & Start Playing
              </IonButton>

              <IonButton
                expand="block"
                onClick={handleOpenXterium}
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
                🔒 Connect Operator Wallet
              </IonButton>

              <IonItem lines="none" className="divider-item">
                  <div className="divider">
                    <span className="line"></span>
                    <IonText color="medium" className="text">
                      Or
                    </IonText>
                    <span className="line"></span>
                  </div>
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleLogin}
                className="custom-button"
                style={{
                  marginTop: '12px',
                  height: '50px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                }}
              >Login
              </IonButton>
              
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
          isOpen={isModalOpen}
          onDidDismiss={() => setIsModalOpen(false)}
          initialBreakpoint={0.5}
          breakpoints={[0, 0.5]}
          backdropBreakpoint={0.25}
        >
          <IonContent className="ion-padding" style={{ '--background': 'var(--background-color)' }}>
            <div style={{ padding: '8px' }}>
              <h2 style={{ color: 'var(--lottery-gold)' }}>Register Manually</h2>
              <p style={{ color: 'var(--text-color-secondary)' }}>
                Paste your wallet address below. (Testing Note: This manual entry bypasses standard
                on-chain validation. The live smart contract will programmatically validate wallet
                eligibility against an access list before processing transactions.)
              </p>
              {/* <IonItem
                lines="none"
                style={{
                  '--background': 'rgba(255,255,255,0.05)',
                  '--min-height': '60px',
                  borderRadius: 'var(--border-radius)',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                  marginTop: '16px',
                }}
              >
                <IonInput
                  placeholder="Paste your wallet address here"
                  value={walletInput}
                  onIonInput={e => setWalletInput(e.detail.value!)}
                  clearInput
                  style={{ color: 'var(--text-color)' }}
                />
              </IonItem> */}

              {walletInput.trim().length < 42 ? (
                <IonButton
                  className="custom-button"
                  expand="block"
                  onClick={openXteriumApp}
                  style={{ marginTop: '24px', '--background': 'var(--lottery-emerald)' }}
                >
                  Register This Address
                </IonButton>
              ) : (
                <>
                <IonButton
                    className="custom-button"
                    expand="block"
                    onClick={handleManualRegister}
                    style={{ marginTop: '24px', '--background': 'var(--lottery-gold)', color: 'black', fontWeight: 'bold' }}
                >
                    🚀 Register & Play
                </IonButton>
                <IonButton
                  fill="clear"
                  expand="block"
                  onClick={handlePaste}
                  style={{ marginTop: '12px' }}
                >
                  <IonIcon slot="start" icon={clipboardOutline} />
                  Paste from Clipboard
                </IonButton>
                </>
              )}
            </div>
          </IonContent>
        </IonModal>

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
                       {loginState? ('Login') : ('Register')} 
                      </h2>
                    </div>
                    <p style={{ color: "var(--lottery-gold)" }}>First wallet: {connectedWallet}</p> 
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

export default RegistrationPage;
