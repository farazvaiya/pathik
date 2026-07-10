import { useState, useEffect } from 'react';

export default function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function request() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Location access denied');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, ...options }
    );
  }

  return { position, error, loading, request };
}
