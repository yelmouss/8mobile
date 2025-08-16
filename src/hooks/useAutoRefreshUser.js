import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Mirrors AccountPage behavior: initial delayed refresh then 5-min interval + on app focus
export default function useAutoRefreshUser() {
  const { user, refreshUser } = useAuth();
  const hasInitialized = useRef(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      timeoutRef.current = setTimeout(() => {
        refreshUser();
      }, 5000);
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (user) refreshUser();
    }, 300000); // 5 minutes

  const handleFocus = () => refreshUser();

    // RN AppState focus handling
    const { AppState } = require('react-native');
    let currentState = AppState.currentState;
    const sub = AppState.addEventListener('change', (nextState) => {
      if ((currentState === 'background' || currentState === 'inactive') && nextState === 'active') {
        handleFocus();
      }
      currentState = nextState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      sub?.remove?.();
    };
  }, [user, refreshUser]);
}
