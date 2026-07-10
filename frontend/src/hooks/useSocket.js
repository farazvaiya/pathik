import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// Empty = same-origin; Vite proxies /socket.io → backend in dev.
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

// Socket singleton
let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('pathik_access_token_v1');
    const opts = {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    };
    // No URL → current page origin (works with Vite WS proxy)
    socket = API_BASE ? io(API_BASE, opts) : io(opts);

    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Get VAPID key from backend
    const res = await fetch(`${API_BASE}/api/v1/notifications/vapid-key`);
    const { data } = await res.json();
    if (!data?.publicKey) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });

    // Send subscription to backend
    const token = localStorage.getItem('pathik_access_token_v1');
    if (token) {
      await fetch(`${API_BASE}/api/v1/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subscription),
      });
    }

    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}

// Unsubscribe from push
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();

      const token = localStorage.getItem('pathik_access_token_v1');
      if (token) {
        await fetch(`${API_BASE}/api/v1/notifications/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

// Custom hook for socket events
export function useSocket(event, handler) {
  useEffect(() => {
    const s = getSocket();
    s.on(event, handler);
    return () => s.off(event, handler);
  }, [event, handler]);
}

// Custom hook for real-time alerts
export function useRealtimeAlerts(onAlert, onSighting, onAlertUpdate) {
  useEffect(() => {
    const s = getSocket();
    if (onAlert) s.on('alert:new', onAlert);
    if (onSighting) s.on('sighting:new', onSighting);
    if (onAlertUpdate) s.on('alert:update', onAlertUpdate);

    return () => {
      if (onAlert) s.off('alert:new', onAlert);
      if (onSighting) s.off('sighting:new', onSighting);
      if (onAlertUpdate) s.off('alert:update', onAlertUpdate);
    };
  }, [onAlert, onSighting, onAlertUpdate]);
}

// Custom hook for user notifications
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const s = getSocket();

    const handleNotification = (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
    };

    s.on('notification:new', handleNotification);
    return () => s.off('notification:new', handleNotification);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    const token = localStorage.getItem('pathik_access_token_v1');
    if (token) {
      await fetch(`${API_BASE}/api/v1/notifications/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
    }
  }, []);

  return { notifications, unreadCount, markAllRead };
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
