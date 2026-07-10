import { useEffect, useRef } from 'react';
import { getStoredUser, getAccessToken, updateLocation } from '../api';

const SYNC_INTERVAL = 60_000; // 60 seconds

export default function useLocationSync() {
  const intervalRef = useRef(null);

  useEffect(() => {
    function startSync() {
      if (intervalRef.current) return;

      intervalRef.current = setInterval(async () => {
        const user = getStoredUser();
        const token = getAccessToken();
        if (!user || !token) return;

        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await updateLocation(pos.coords.latitude, pos.coords.longitude);
            } catch {
              // silent — don't disrupt user experience
            }
          },
          () => {
            // silent — location denied or unavailable
          },
          { enableHighAccuracy: false, timeout: 10_000 }
        );
      }, SYNC_INTERVAL);
    }

    startSync();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
