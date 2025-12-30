import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface YearInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const YearInput: React.FC<YearInputProps> = ({ 
  value, 
  onChange, 
  className,
  placeholder 
}) => {
  const currentYear = new Date().getFullYear();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove any non-digit characters except the dash
    inputValue = inputValue.replace(/[^\d-]/g, '');
    
    // If user tries to edit the completed format, handle it
    if (inputValue.includes('-')) {
      const parts = inputValue.split('-');
      // Only allow editing the first part (before dash)
      inputValue = parts[0].slice(0, 4);
    }
    
    // Limit to 4 digits for the first year
    inputValue = inputValue.slice(0, 4);
    
    // Validate each digit as it's typed
    if (inputValue.length > 0) {
      const yearSoFar = parseInt(inputValue, 10);
      
      // Check if the partial year could potentially be valid
      // For example, if current year is 2025:
      // - "2" is valid (could become 2020-2025)
      // - "20" is valid
      // - "202" is valid
      // - "2026" is invalid (greater than current year)
      // - "3" is invalid (can't be 3xxx if current year is 2xxx)
      
      const maxFirstDigit = Math.floor(currentYear / 1000);
      const maxSecondDigit = Math.floor((currentYear % 1000) / 100);
      const maxThirdDigit = Math.floor((currentYear % 100) / 10);
      const maxFourthDigit = currentYear % 10;
      
      let isValid = true;
      
      if (inputValue.length === 1) {
        // First digit can only be 1 or 2 (for years 1xxx or 2xxx)
        isValid = parseInt(inputValue[0], 10) <= maxFirstDigit;
      } else if (inputValue.length === 2) {
        // Check if first two digits are valid
        const firstTwo = parseInt(inputValue, 10);
        isValid = firstTwo <= Math.floor(currentYear / 100);
      } else if (inputValue.length === 3) {
        // Check if first three digits are valid
        const firstThree = parseInt(inputValue, 10);
        isValid = firstThree <= Math.floor(currentYear / 10);
      } else if (inputValue.length === 4) {
        // Full year check - must be <= current year
        isValid = yearSoFar <= currentYear;
      }
      
      if (!isValid) {
        return; // Reject the input
      }
    }
    
    // Auto-complete with dash and next year when 4 digits are entered
    if (inputValue.length === 4) {
      const startYear = parseInt(inputValue, 10);
      const formattedValue = `${startYear}-${startYear + 1}`;
      onChange(formattedValue);
    } else {
      onChange(inputValue);
    }
  }, [currentYear, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      // If backspace is pressed and value contains a dash, clear everything
      if (e.key === 'Backspace' && value.includes('-')) {
        e.preventDefault();
        onChange('');
      }
      return;
    }
    
    // Block any non-numeric input
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, [value, onChange]);

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder || `${currentYear}-${currentYear + 1}`}
    />
  );
};

export default YearInput;
