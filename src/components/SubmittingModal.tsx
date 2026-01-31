import { IonSpinner, IonText } from '@ionic/react';
import { useState } from 'react';
import useAppStore from '../store/useAppStore';

const SubmittingModal: React.FC = () => {
  const { isSubmitting } = useAppStore();
  const [isSubmittingModalMinimized, setIsSubmittingModalMinimized] = useState(false);

  return (
    <>
      {isSubmitting && (
        isSubmittingModalMinimized ? (
          <div
            style={{
              position: "fixed",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              backgroundColor: "var(--ion-color-warning)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              cursor: "pointer",
              userSelect: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.2s ease",
              pointerEvents: "auto",
            }}
            onClick={() => setIsSubmittingModalMinimized(false)}
          >
            <IonSpinner name="crescent" color="warning" style={{ width: "16px", height: "16px" }} />
            <span>Transaction submitting...</span>
          </div>
        ) : (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              backgroundColor: "var(--background-color)",
              color: "white",
              padding: "32px 24px 24px 24px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "320px",
              gap: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255, 215, 0, 0.2)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255, 215, 0, 0.1)",
                border: "1px solid rgba(255, 215, 0, 0.2)",
                color: "var(--lottery-gold)",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onClick={() => setIsSubmittingModalMinimized(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 215, 0, 0.15)";
                e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 215, 0, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.2)";
              }}
            >
              Minimize
            </div>

            <div style={{
              background: "rgba(46, 213, 115, 0.1)",
              borderRadius: "50%",
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(46, 213, 115, 0.3)"
            }}>
              <IonSpinner name="crescent" color="primary" style={{ width: "40px", height: "40px" }} />
            </div>
            <IonText style={{ fontSize: "1.1rem", fontWeight: 700, textAlign: "center", color: "var(--lottery-emerald)" }}>
              SUBMITTING TRANSACTION
            </IonText>
            <IonText style={{ fontSize: "0.9rem", opacity: 0.8, textAlign: "center", color: "var(--text-color-secondary)" }}>
              Please don't close this window or navigate away until the process is complete.
            </IonText>
          </div>
        )
      )}
    </>
  );
};

export default SubmittingModal;
