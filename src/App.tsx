import { ApolloProvider } from '@apollo/client';
import { IonApp, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import client from './services/apolloClient';

import '@ionic/react/css/core.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/typography.css';

import './theme/theme.css';
import './theme/variables.css';

import AppTabs from './components/AppTabs';
import ReferralAcceptPage from './pages/ReferralAcceptPage';
import RegistrationPage from './pages/RegistrationPage';
import useAppStore from './store/useAppStore';

setupIonicReact();

const AppContent: React.FC = () => {
  const { isConnected } = useAppStore();
  const pathname = window.location.pathname;

  if (pathname.startsWith('/accept-referral')) {
    return <ReferralAcceptPage />;
  }

  if (isConnected) {
    return <AppTabs />;
  } else {
    return <RegistrationPage />;
  }
};

const App: React.FC = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAppStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isHydrated) {
    return (
      <IonApp>
        <div className="loading-container ion-text-center">
          <IonSpinner name="crescent" className="loading-spinner" />
          <p style={{ color: 'var(--text-color-secondary)', marginTop: '16px' }}>
            Loading Session...
          </p>
        </div>
      </IonApp>
    );
  }

  return (
    <ApolloProvider client={client}>
      <IonApp>
        {/* @ts-ignore */}
        <IonReactRouter>
          <AppContent />
        </IonReactRouter>
      </IonApp>
    </ApolloProvider>
  );
};


export default App;
