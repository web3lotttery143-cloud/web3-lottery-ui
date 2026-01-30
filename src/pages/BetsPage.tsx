import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { alertCircle } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';
import walletService from '../services/walletService';

const BetsPage: React.FC = () => {
  const walletAddress = useAppStore(state => state.walletAddress);
  const {affiliateEarnings, setAffiliateEarnings, referralUpline} = useAppStore();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactionHash, setSelectedTransactionHash] = useState<string | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const fetchBets = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await walletService.getMemberBets(walletAddress);
      if (response.success && response.data) {
        // The API returns { ..., bets: [...] }
        const fetchedBets = response.data.bets || [];
        setBets(fetchedBets);

        // Calculate affiliate earnings: bets count * 0.5 * 10%
        if(referralUpline !== "") {
          const calculatedEarnings = fetchedBets.length * 0.5 * 0.10;
          setAffiliateEarnings(calculatedEarnings);
        } else {
          setAffiliateEarnings(0);
        }
        
      } else {
        // If success is false, or data is missing
        if (!response.success) {
             setError(response.message || 'Failed to fetch bets');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching bets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [walletAddress]);

  const handleRefresh = (event: CustomEvent) => {
    fetchBets().finally(() => event.detail.complete());
  };

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">Failed to load bets: {error}</IonText>

          <IonButton onClick={() => fetchBets()} expand="block">
            Retry
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent={true} className="ion-no-border">
      <IonToolbar style={{ '--background': 'transparent' }}>
      <IonTitle style={{ fontWeight: 800, fontSize: '1.5rem' }}>
      <span style={{ color: 'var(--lottery-gold)' }}>My</span> Tickets 🎫
      </IonTitle>
      </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
      <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      {loading && (
      <div className="ion-text-center ion-padding" style={{ marginTop: '20vh' }}>
      <IonSpinner name="crescent" color="warning" style={{ transform: 'scale(1.5)' }} />
      <p style={{ marginTop: '1rem', color: 'var(--text-color-secondary)' }}>Loading your tickets...</p>
      </div>
      )}

      {!loading && bets.length === 0 && (
      <div className="ion-text-center ion-padding fade-in" style={{ marginTop: '15vh' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎟️</div>
      <IonText>
        <h2 style={{ fontWeight: 700, color: 'var(--lottery-gold)', marginBottom: '0.5rem' }}>No Tickets Yet</h2>
        <p style={{ color: 'var(--text-color-secondary)', maxWidth: '300px', margin: '0 auto', lineHeight: '1.5' }}>
        You haven't purchased any tickets yet. Head over to the dashboard and try your luck!
        </p>
      </IonText>
      <IonButton routerLink="/dashboard" fill="outline" color="warning" style={{ marginTop: '2rem' }} shape="round">
        Play Now
      </IonButton>
      </div>
      )}

      <div className="fade-in" style={{ paddingBottom: '20px' }}>
      {bets.map((bet: any) => {
      const betDate = bet.date ? new Date(bet.date) : null;
      return (
        <IonCard 
        key={bet._id} 
        className="custom-card ticket-card" 
        style={{ 
        margin: '0 0 20px 0', 
        background: 'var(--card-background)',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255, 215, 0, 0.1)'
        }}
        >
        <div style={{ 
        background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 100%)',
        padding: '16px',
        borderBottom: '1px dashed rgba(255,255,255,0.1)'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <IonText color="medium" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Draw Number
          </IonText>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--ion-text-color)' }}>
          #{bet.draw_number}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <IonBadge
          style={{
          background: 'var(--gold-gradient)',
          color: '#000',
          fontWeight: '800',
          fontSize: '1rem',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(255, 215, 0, 0.3)'
          }}
        >
          ${bet.bet_amount}
        </IonBadge>
        <IonBadge
          style={{
          background: bet.success ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #f44336 0%, #da190b 100%)',
          color: '#fff',
          fontWeight: '700',
          fontSize: '0.9rem',
          padding: '6px 10px',
          borderRadius: '8px',
          boxShadow: bet.success ? '0 4px 10px rgba(76, 175, 80, 0.3)' : '0 4px 10px rgba(244, 67, 54, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap'
          }}
        >
          {bet.success ? '✓ Success' : '✗ Failed'}
        </IonBadge>
        </div>
        </div>
        </div>

        <IonCardContent style={{ padding: '20px 16px' }}>
        <div style={{ marginBottom: '16px' }}>
        <IonLabel style={{ fontSize: '0.9rem', color: 'var(--text-color-secondary)', marginBottom: '8px', display: 'block' }}>
          Your Lucky Numbers
        </IonLabel>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {bet.bet_number?.split('').map((digit: string, index: number) => (
          <div
          key={index}
          className="lottery-number"
          style={{ 
          width: '45px', 
          height: '45px', 
          fontSize: '1.3rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--lottery-gold)',
          borderRadius: '50%',
          color: 'var(--lottery-gold)',
          boxShadow: '0 0 10px rgba(255, 215, 0, 0.1)'
          }}
          >
          {digit}
          </div>
          ))}
        </div>
        </div>
        
        <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-color-secondary)', fontSize: '0.85rem' }}>
          <span>📅</span>
          <span>{betDate ? betDate.toLocaleDateString() : 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-color-secondary)', fontSize: '0.85rem' }}>
          <span>🕒</span>
            <span>{betDate ? betDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}) : 'N/A'}</span>
        </div>
        </div>

        {bet.transaction_hash && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.75rem',
          color: 'var(--text-color-secondary)'
        }}>
          <div style={{ marginBottom: '4px' }}>Transaction Hash:</div>
          <div style={{ 
          fontFamily: 'monospace', 
          color: bet.success ? 'var(--lottery-gold)' : '#f44336',
          wordBreak: 'break-all'
          }}>
          {bet.success ? (
            <a href={`https://node.xode.net/xode-polkadot/extrinsics/${bet.transaction_hash}`} target='_blank' rel='noopener noreferrer'>
              {bet.transaction_hash}
            </a>
          ) : (
            <span 
              onClick={() => {
                setSelectedTransactionHash(bet.transaction_hash);
                setShowTransactionModal(true);
              }}
              style={{ cursor: 'pointer', textDecoration: 'underline', userSelect: 'none' }}
            >
              Failed transaction - Click to view more info
            </span>
          )}
          </div>
        </div>
        )}
        </IonCardContent>
        </IonCard>
      );
      })}
      </div>
      </IonContent>

      <IonModal isOpen={showTransactionModal} onDidDismiss={() => setShowTransactionModal(false)} initialBreakpoint={1}>
        <IonContent className="ion-padding" style={{ "--background": "var(--background-color)" }}>
          <div style={{ padding: "16px", textAlign: "center" }}>
            <div style={{
              background: "rgba(244, 67, 54, 0.1)",
              borderRadius: "50%",
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              border: "2px solid var(--lottery-crimson)"
            }}>
              <IonIcon icon={alertCircle} style={{ fontSize: "40px", color: "var(--lottery-crimson)" }} />
            </div>
            
            <h3 style={{ color: "var(--lottery-crimson)", fontWeight: "900", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
              ⚠️ FAILED TRANSACTION
            </h3>
            <p style={{ color: "var(--text-color-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
              Your transaction could not be completed. <br/>
              Please review the transaction details below.
            </p>

            <div style={{ 
              background: "linear-gradient(180deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.8) 100%)", 
              borderRadius: "16px", 
              padding: "20px",
              border: "1px solid rgba(244, 67, 54, 0.3)",
              marginBottom: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              textAlign: "left"
            }}>
              <div style={{ marginBottom: "12px" }}>
                <IonText style={{ 
                  fontSize: "0.85rem", 
                  color: "var(--text-color-secondary)", 
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontWeight: "600"
                }}>
                  Transaction Hash
                </IonText>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                color: '#f44336',
                background: 'rgba(244, 67, 54, 0.05)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(244, 67, 54, 0.2)',
                lineHeight: '1.6'
              }}>
                {selectedTransactionHash}
              </div>
            </div>
          </div>
        </IonContent>
        <IonFooter>
          <div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <IonButton
              fill="outline"
              color="medium"
              expand="block"
              onClick={() => setShowTransactionModal(false)}
              style={{
                flex: 1,
                fontWeight: "600"
              }}
            >
              Close
            </IonButton>
          </div>
        </IonFooter>
      </IonModal>
    </IonPage>
  );
};

export default BetsPage;
