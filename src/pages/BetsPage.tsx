import { useQuery } from '@apollo/client';
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
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useEffect } from 'react';
import { GET_MY_BETS } from '../graphql/queries';
import useAppStore from '../store/useAppStore';

const BetResult: React.FC<{ bet: any }> = ({ bet }) => {
  if (!bet.cycle || bet.cycle.status !== 'COMPLETED') {
    return (
      <IonText style={{ color: 'var(--text-color-secondary)', fontWeight: '500' }}>Pending</IonText>
    );
  }

  const isWinner = bet.selectedNumber === bet.cycle.winningNumber;

  return isWinner ? (
    <IonText style={{ color: 'var(--lottery-emerald)', fontWeight: '700' }}>🎉 Winner!</IonText>
  ) : (
    <IonText style={{ color: 'var(--lottery-crimson)', opacity: 0.8, fontWeight: '500' }}>
      Lost ({bet.cycle.winningNumber ?? 'N/A'})
    </IonText>
  );
};

const UserInfoHeader: React.FC = () => {
  const { walletAddress, userProfile } = useAppStore();
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...Error';
  const totalRewards =
    (userProfile?.totalAffiliateEarnings || 0) + (userProfile?.totalRebates || 0);

  const truncatedWallet = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '...';
  const truncatedContract = contractAddress
    ? `${contractAddress.substring(0, 6)}...${contractAddress.substring(
        contractAddress.length - 4
      )}`
    : '...';

  return (
    <div
      style={{
        padding: '16px 20px 12px 20px',
        background: 'var(--card-background-color)',
        marginBottom: '16px',
        borderBottom: '1px solid var(--lottery-gold)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
          Wallet
        </IonText>
        <IonText style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)' }}>
          {truncatedWallet}
        </IonText>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
          Contract
        </IonText>
        <IonText style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)' }}>
          {truncatedContract}
        </IonText>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
          Pending Rewards
        </IonText>
        <IonBadge
          style={{
            background: 'var(--lottery-emerald)',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '0.9rem',
            padding: '6px 10px',
          }}
        >
          ${totalRewards.toFixed(2)}
        </IonBadge>
      </div>
    </div>
  );
};

const BetsPage: React.FC = () => {
  const walletAddress = useAppStore(state => state.walletAddress);
  const { data, loading, error, refetch } = useQuery(GET_MY_BETS, {
    variables: { walletAddress, page: 1, limit: 100 },
    skip: !walletAddress,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    console.log('[BetsPage] Wallet Address:', walletAddress);
    console.log('[BetsPage] Loading:', loading);
    console.log('[BetsPage] Error:', error);
    console.log('[BetsPage] Data:', data);
    if (data) {
      console.log('[BetsPage] myBets array:', data.myBets);
      console.log('[BetsPage] Number of bets received:', data.myBets?.length);
    }
  }, [walletAddress, loading, error, data]);

  const handleRefresh = (event: CustomEvent) => {
    refetch().finally(() => event.detail.complete());
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
          <IonText color="danger">Failed to load bets: {error.message}</IonText>

          <IonButton onClick={() => refetch()} expand="block">
            Retry
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>🎫 My Tickets</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <UserInfoHeader />

        {loading && (
          <div className="ion-text-center ion-padding" style={{ marginTop: '10vh' }}>
            <IonSpinner name="crescent" className="loading-spinner" />
          </div>
        )}

        {!loading && data && data.myBets && data.myBets.length === 0 && (
          <div className="ion-text-center ion-padding fade-in" style={{ marginTop: '10vh' }}>
            <IonText>
              <h3 style={{ fontWeight: 600, color: 'var(--lottery-gold)' }}>No Tickets Yet</h3>
              <p style={{ color: 'var(--text-color-secondary)' }}>
                You haven't purchased any tickets yet. Go to the dashboard to play!
              </p>
            </IonText>
          </div>
        )}

        <div className="fade-in" style={{ padding: '0 16px' }}>
          {data?.myBets?.map((bet: any) => {
            console.log(
              '[BetsPage] Attempting to render bet object:',
              JSON.stringify(bet, null, 2)
            );

            if (!bet || !bet.cycle || !bet.id) {
              console.warn('[BetsPage] Skipping render for bet with missing data:', bet?.id);
              return null;
            }
            return (
              <IonCard key={bet.id} className="custom-card" style={{ margin: '0 0 16px 0' }}>
                <IonCardHeader
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                  }}
                >
                  <IonCardTitle className="custom-card-title" style={{ padding: 0, margin: 0 }}>
                    Draw #{bet.cycle.cycleNumber}
                  </IonCardTitle>
                  <IonBadge
                    style={{
                      background: 'var(--gold-gradient)',
                      color: '#000000',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      padding: '6px 10px',
                    }}
                  >
                    $0.50
                  </IonBadge>
                </IonCardHeader>

                <IonCardContent>
                  <IonList style={{ background: 'transparent' }}>
                    <IonItem style={{ '--background': 'transparent' }}>
                      <IonLabel>Your Numbers</IonLabel>
                      <div style={{ display: 'flex', gap: '8px' }} slot="end">
                        {bet.selectedNumber?.split('').map((digit: string, index: number) => (
                          <div
                            key={index}
                            className="lottery-number"
                            style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                    </IonItem>
                    <IonItem style={{ '--background': 'transparent' }}>
                      <IonLabel>Status</IonLabel>
                      <div slot="end">
                        <BetResult bet={bet} />
                      </div>
                    </IonItem>
                    <IonItem style={{ '--background': 'transparent' }}>
                      <IonLabel>Rebate</IonLabel>
                      <IonText
                        slot="end"
                        style={{
                          color: 'var(--lottery-emerald)',
                          fontWeight: '600',
                          fontSize: '1rem',
                        }}
                      >
                        {/* Add safety check for rebateCredited */}+ $
                        {bet.rebateCredited?.toFixed(2) ?? '0.00'}
                      </IonText>
                    </IonItem>
                    <IonItem style={{ '--background': 'transparent' }} lines="none">
                      <IonLabel
                        style={{ fontSize: '0.85em', color: 'var(--text-color-secondary)' }}
                      >
                        🕒 Purchased:{' '}
                        {bet.createdAt ? new Date(bet.createdAt).toLocaleString() : 'N/A'}
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BetsPage;
