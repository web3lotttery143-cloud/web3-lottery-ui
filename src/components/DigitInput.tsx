import React, { useRef, useState } from 'react';
import './DigitInput.css';

interface DigitInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DigitInput: React.FC<DigitInputProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value || '';
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    const finalValue = numericValue.slice(0, 3);
    onChange(finalValue);
  };

  const digits = value.padEnd(3, ' ').split('');

  return (
    <div
      className={`digit-input-container ${isFocused ? 'focused' : ''}`}
      onClick={handleContainerClick}
    >
      {digits.map((digit, index) => (
        <div key={index} className="digit-box">
          {digit.trim() === '' ? <span className="digit-placeholder"></span> : digit}
        </div>
      ))}
      <input
        ref={inputRef}
        type="tel"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="hidden-input"
        maxLength={3}
      />
    </div>
  );
};

export default DigitInput;
