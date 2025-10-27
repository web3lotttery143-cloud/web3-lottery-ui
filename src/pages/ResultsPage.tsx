import { useQuery } from '@apollo/client';
import {
  IonBadge,
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
import React from 'react';
import { GET_CYCLE_HISTORY } from '../graphql/queries';

const ResultsPage: React.FC = () => {
  const { data, loading, refetch } = useQuery(GET_CYCLE_HISTORY, {
    variables: { page: 1, limit: 50 },
    fetchPolicy: 'cache-and-network',
  });

  const handleRefresh = (event: CustomEvent) => {
    refetch().finally(() => event.detail.complete());
  };

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>🏆 Past Results</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading && (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" className="loading-spinner" />
          </div>
        )}

        {!loading && data?.cycleHistory.length === 0 && (
          <div className="ion-text-center ion-padding fade-in" style={{ marginTop: '25vh' }}>
            <IonText>
              <h3 style={{ fontWeight: 600, color: 'var(--lottery-gold)' }}>No Results Yet</h3>
              <p style={{ color: 'var(--text-color-secondary)' }}>
                No lottery draws have been completed yet.
              </p>
            </IonText>
          </div>
        )}

        <div className="fade-in" style={{ padding: '16px' }}>
          {data?.cycleHistory.map((cycle: any) => (
            <IonCard key={cycle.id} className="custom-card" style={{ margin: '0 0 16px 0' }}>
              <IonCardHeader>
                <IonCardTitle className="custom-card-title">
                  🎯 Draw #{cycle.cycleNumber}
                  {cycle.jackpotRolledOver && (
                    <IonBadge
                      style={{
                        background: 'var(--gold-gradient)',
                        color: '#000000',
                        marginLeft: '8px',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                      }}
                    >
                      JACKPOT ROLLED
                    </IonBadge>
                  )}
                </IonCardTitle>
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
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                        Winning Number
                      </IonText>
                    </IonLabel>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {cycle.winningNumber.split('').map((digit: string, index: number) => (
                        <div
                          key={index}
                          className="lottery-number"
                          style={{
                            width: '45px',
                            height: '45px',
                            fontSize: '1.1rem',
                          }}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
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
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                        Total Winners
                      </IonText>
                    </IonLabel>
                    <IonText
                      style={{
                        color:
                          cycle.totalWinners > 0
                            ? 'var(--lottery-emerald)'
                            : 'var(--text-color-secondary)',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                      }}
                    >
                      {cycle.totalWinners}
                    </IonText>
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
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                        Total Jackpot
                      </IonText>
                    </IonLabel>
                    <IonText
                      style={{
                        color: 'var(--lottery-gold)',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                      }}
                    >
                      ${parseFloat(cycle.totalJackpot).toFixed(2)}
                    </IonText>
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
                    <IonLabel>
                      <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                        Draw Date
                      </IonText>
                    </IonLabel>
                    <IonText style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      {new Date(cycle.endedAt).toLocaleDateString()}
                    </IonText>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResultsPage;
