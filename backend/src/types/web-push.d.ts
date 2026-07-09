declare module 'web-push' {
  interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }

  interface NotificationPayload {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    renotify?: boolean;
    silent?: boolean;
    timestamp?: number;
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
    vibrate?: number[];
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload: string | Buffer): Promise<{ statusCode: number }>;
  function generateVapidKeys(): { publicKey: string; privateKey: string };

  export { setVapidDetails, sendNotification, generateVapidKeys, PushSubscription, NotificationPayload };
}
