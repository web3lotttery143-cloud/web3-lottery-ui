import { IonButton, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import './WinningNumberModal.css';

interface WinningNumberModalProps {
  isOpen: boolean;
  winningNumber: string;
  drawLabel?: string;
  onDismiss: () => void;
}

const SlotDigit: React.FC<{ digit: string; isSpinning: boolean }> = ({ digit, isSpinning }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!isSpinning) {
      const digitValue = parseInt(digit, 10);

      if (isNaN(digitValue)) {
        console.error(`[SlotDigit] Invalid digit prop received: ${digit}`);
        return;
      }

      const yOffset = digitValue * 90;

      const finalPosition = 90 * 10 * 5 + yOffset;
      setStyle({
        transform: `translateY(-${finalPosition}px)`,
        transition: 'transform 1s ease-out',
      });
    } else {
      setStyle({ transform: 'translateY(0)', transition: 'none' });
    }
  }, [isSpinning, digit]);

  const numbers = Array.from({ length: 60 }, (_, i) => i % 10).join('');

  return (
    <div className={`slot-wrapper ${!isSpinning ? 'landed' : ''}`}>
      <div className="slot-shine"></div>
      <div className={`slot-inner ${isSpinning ? 'spin' : ''}`} style={style}>
        {numbers.split('').map((n, i) => (
          <div key={i} className="slot-number">
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};

const WinningNumberModal: React.FC<WinningNumberModalProps> = ({
  isOpen,
  winningNumber,
  drawLabel,
  onDismiss,
}) => {
  const [digits, setDigits] = useState(['0', '0', '0']);
  const [isSpinning, setIsSpinning] = useState([false, false, false]);

  useEffect(() => {
    if (isOpen) {
      setIsSpinning([true, true, true]);

      setDigits(['0', '0', '0']);

      setTimeout(() => {
        setIsSpinning(s => [false, s[1], s[2]]);
        setDigits(d => [winningNumber[0], d[1], d[2]]);
      }, 1500);

      setTimeout(() => {
        setIsSpinning(s => [s[0], false, s[2]]);
        setDigits(d => [d[0], winningNumber[1], d[2]]);
      }, 2500);

      setTimeout(() => {
        setIsSpinning(s => [s[0], s[1], false]);
        setDigits(d => [d[0], d[1], winningNumber[2]]);
      }, 3500);
    }
  }, [isOpen, winningNumber]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="draw-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>🎉 We Have a Winner! 🎉</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="slot-machine-container">
          <h2 className="draw-title">The winning number is...</h2>
          {drawLabel && <h3 className="draw-subtitle">{drawLabel}</h3>}
          <div className="slots-container">
            <SlotDigit digit={digits[0]} isSpinning={isSpinning[0]} />
            <SlotDigit digit={digits[1]} isSpinning={isSpinning[1]} />
            <SlotDigit digit={digits[2]} isSpinning={isSpinning[2]} />
          </div>
          <IonButton
            className="custom-button"
            expand="block"
            onClick={onDismiss}
            style={{ marginTop: '32px' }}
          >
            Close
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default WinningNumberModal;
