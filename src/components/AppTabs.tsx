import { useQuery } from '@apollo/client';
import { IonIcon, IonLabel } from '@ionic/react';
import {
  cashOutline,
  listCircleOutline,
  personCircleOutline,
  pieChartOutline,
  shieldCheckmarkOutline,
  terminal,
  terminalOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { GET_ME_AND_CURRENT_CYCLE } from '../graphql/queries';
import useAppStore from '../store/useAppStore';
import WinningNumberModal from './WinningNumberModal';

import AdminPage from '../pages/AdminPage';
import BetsPage from '../pages/BetsPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import ResultsPage from '../pages/ResultsPage';
import TerminalPage from '../pages/TerminalPage';

type Tab = 'dashboard' | 'bets' | 'results' | 'profile' | 'terminal' | 'admin';

const AppTabs: React.FC = () => {
  const {
    isAdmin,
    walletAddress,
    setUserProfile,
    lastSeenCompletedCycle,
    setLastSeenCompletedCycle,
    isOverrideMode,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [lastWinningNumber, setLastWinningNumber] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_ME_AND_CURRENT_CYCLE, {
    variables: { walletAddress },
    skip: !walletAddress,
    pollInterval: 30000,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.me) {
      setUserProfile(data.me);
    }

    const lastCompleted = data?.lastCompletedCycle;

    if (
      lastCompleted &&
      lastCompleted.cycleNumber > lastSeenCompletedCycle &&
      lastCompleted.winningNumber &&
      lastCompleted.winningNumber.length === 3
    ) {
      console.log(
        `[AppTabs] New draw detected! Cycle #${lastCompleted.cycleNumber}. Winning Number: ${lastCompleted.winningNumber}`
      );

      setLastWinningNumber(lastCompleted.winningNumber);
      setIsDrawModalOpen(true);
      setLastSeenCompletedCycle(lastCompleted.cycleNumber);
    }
  }, [data, setUserProfile, lastSeenCompletedCycle, setLastSeenCompletedCycle, refetch]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage data={data} loading={loading} refetch={refetch} />;
      case 'bets':
        return <BetsPage />;
      case 'results':
        return <ResultsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'terminal':
        return <TerminalPage/>
      case 'admin':
        return isAdmin ? (
          <AdminPage />
        ) : (
          <DashboardPage data={data} loading={loading} refetch={refetch} />
        );
      default:
        return <DashboardPage data={data} loading={loading} refetch={refetch} />;
    }
  };

  const TabButton: React.FC<{
    tab: Tab;
    icon: string;
    label: string;
    isSelected: boolean;
  }> = ({ tab, icon, label, isSelected }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`custom-tab-button ${isSelected ? 'selected' : ''}`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        background: 'transparent',
        border: 'none',
        color: isSelected ? 'var(--lottery-gold)' : 'var(--text-color-secondary)',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <IonIcon
        icon={icon}
        style={{
          fontSize: '24px',
          marginBottom: '4px',
        }}
      />
      <IonLabel style={{ fontSize: '12px', fontWeight: '600' }}>{label}</IonLabel>
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '3px',
            background: 'var(--lottery-gold)',
            borderRadius: '0 0 2px 2px',
          }}
        ></div>
      )}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>{renderTabContent()}</div>
      {isOverrideMode && (
        <div
          style={{
        position: 'fixed',
        bottom: '70px',
        width: '100%',
        background: 'linear-gradient(135deg, #ff4d4d 0%, #b30000 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '700',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: '0 -2px 10px rgba(179, 0, 0, 0.4)',
        borderTop: '1px solid rgba(255, 77, 77, 0.3)',
        letterSpacing: '0.5px',
          }}
        >
          <IonIcon
        icon={terminal}
        style={{
          fontSize: '18px',
          animation: 'pulse 2s ease-in-out infinite',
        }}
          />
          <span style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
        OVERRIDE MODE ACTIVE
          </span>
        </div>
      )}
      <div
        style={{
          position: 'fixed',
          bottom: '0',
          width: '100%',
          zIndex: '1000',
          display: 'flex',
          background: 'var(--card-background-color)',
          borderTop: '2px solid var(--lottery-gold)',
          height: '70px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <TabButton
          tab="dashboard"
          icon={pieChartOutline}
          label="Dashboard"
          isSelected={activeTab === 'dashboard'}
        />
        <TabButton
          tab="profile"
          icon={personCircleOutline}
          label="Profile"
          isSelected={activeTab === 'profile'}
        />
        <TabButton
          tab="bets"
          icon={cashOutline}
          label="My Bets"
          isSelected={activeTab === 'bets'}
        />
        <TabButton
          tab="terminal"
          icon={terminalOutline}
          label="Terminal"
          isSelected={activeTab === 'terminal'}
        />
        {/* <TabButton
          tab="results"
          icon={listCircleOutline}
          label="Results"
          isSelected={activeTab === 'results'}
        /> */}
        {isAdmin && (
          <TabButton
            tab="admin"
            icon={shieldCheckmarkOutline}
            label="Admin"
            isSelected={activeTab === 'admin'}
          />
        )}
      </div>
      <WinningNumberModal
        isOpen={isDrawModalOpen}
        winningNumber={lastWinningNumber || '000'}
        onDismiss={() => setIsDrawModalOpen(false)}
      />
    </div>
  );
};

export default AppTabs;
