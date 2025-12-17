import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle } from '@ionic/react';

const TerminalPage: React.FC = () => {
    return (
        <IonPage>
            <IonHeader translucent={true}>
                <IonToolbar>
                    <IonTitle>👨🏻‍💻 Terminal</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <div style={{ height: '88%', width: '100%', backgroundColor: '#000', borderRadius: '8px', color: 'white', padding: '5%' }}>
                    <p>Flourencelapore</p>
                </div>
            </IonContent>
        </IonPage>
    );
}

export default TerminalPage