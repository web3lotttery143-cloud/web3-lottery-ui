import { IonButton, IonContent, IonIcon, IonModal } from '@ionic/react';
import confetti from 'canvas-confetti';
import { closeOutline, trophy } from 'ionicons/icons';
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
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSpinning([true, true, true]);
      setShowConfetti(false);
      setDigits(['0', '0', '0']);

      setTimeout(() => {
        setIsSpinning(s => [false, s[1], s[2]]);
        setDigits(d => [winningNumber[0] || '0', d[1], d[2]]);
      }, 1500);

      setTimeout(() => {
        setIsSpinning(s => [s[0], false, s[2]]);
        setDigits(d => [d[0], winningNumber[1] || '0', d[2]]);
      }, 2500);

      setTimeout(() => {
        setIsSpinning(s => [s[0], s[1], false]);
        setDigits(d => [d[0], d[1], winningNumber[2] || '0']);
        setShowConfetti(true);
        triggerConfetti();
      }, 3500);
    }
  }, [isOpen, winningNumber]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 20001 }; // Higher z-index for ionic modal

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="draw-modal">
      <IonContent className="ion-padding" scrollY={false}>
        <div className="close-button-wrapper" onClick={onDismiss}>
          <IonIcon icon={closeOutline} />
        </div>

        <div className="slot-machine-container">
          <div className={`trophy-icon ${showConfetti ? 'visible' : ''}`}>
            <IonIcon icon={trophy} />
          </div>

          <h2 className="draw-title">WINNING NUMBER</h2>
          {drawLabel && <h3 className="draw-subtitle">{drawLabel}</h3>}

          <div className={`slots-container ${showConfetti ? 'winner-glow' : ''}`}>
            <SlotDigit digit={digits[0]} isSpinning={isSpinning[0]} />
            <SlotDigit digit={digits[1]} isSpinning={isSpinning[1]} />
            <SlotDigit digit={digits[2]} isSpinning={isSpinning[2]} />
          </div>

          <IonButton
            className="claim-button"
            expand="block"
            onClick={onDismiss}
            disabled={isSpinning.some(s => s)}
          >
            {isSpinning.some(s => s) ? 'Drawing...' : 'Awesome!'}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default WinningNumberModal;
