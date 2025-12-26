import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, useIonToast } from '@ionic/react';
import React, { useEffect, useState, useRef } from 'react';
import webSocketService from '../services/webSocket.service';

const TerminalPage: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const contentRef = useRef<HTMLDivElement>(null);
    const [present] = useIonToast();

    useEffect(() => {
        webSocketService.connect();

        const handleMessage = (data: any) => {
            const timestamp = new Date().toLocaleTimeString();
            const message = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
            setLogs(prevLogs => [...prevLogs, `[${timestamp}] ${message}`]);
        };

        const handleStatus = (status: 'connected' | 'disconnected' | 'error', error?: any) => {
            if (status === 'connected') {
                present({
                    message: 'WebSocket Connected',
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                });
            } else if (status === 'error') {
                console.error('WebSocket Error Details:', error);
                present({
                    message: 'WebSocket Connection Failed. Check if the server is running and accessible.',
                    duration: 5000,
                    color: 'danger',
                    position: 'top'
                });
            }
        };

        webSocketService.addListener(handleMessage);
        webSocketService.addStatusListener(handleStatus);

        return () => {
            webSocketService.removeListener(handleMessage);
            webSocketService.removeStatusListener(handleStatus);
            webSocketService.disconnect();
        };
    }, [present]);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <IonPage>
            <IonHeader translucent={true}>
                <IonToolbar>
                    <IonTitle>👨🏻‍💻 Terminal</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <div 
                    ref={contentRef}
                    style={{ 
                        height: '88%', 
                        width: '100%', 
                        backgroundColor: '#000', 
                        borderRadius: '8px', 
                        color: '#0f0', 
                        padding: '1rem',
                        fontFamily: 'monospace',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </IonContent>
        </IonPage>
    );
}

export default TerminalPage