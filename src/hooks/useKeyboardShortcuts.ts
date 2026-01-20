import { useEffect, useCallback } from 'react';

interface KeyboardShortcutOptions {
  onNewEvaluation?: () => void;
  onSave?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onNewEvaluation,
  onSave,
  onClose,
  enabled = true,
}: KeyboardShortcutOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInputFocused = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    // Ctrl+N: New evaluation (works even in inputs)
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      onNewEvaluation?.();
      return;
    }

    // Ctrl+S: Save (works even in inputs)
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      onSave?.();
      return;
    }

    // Escape: Close dialog (only when not in inputs)
    if (event.key === 'Escape' && !isInputFocused) {
      event.preventDefault();
      onClose?.();
      return;
    }
  }, [enabled, onNewEvaluation, onSave, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
