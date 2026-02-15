// Push API type augmentations for TypeScript
export {};

declare global {
  interface ServiceWorkerRegistration {
    pushManager: PushManager;
  }

  interface PushManager {
    getSubscription(): Promise<PushSubscription | null>;
    subscribe(options: PushSubscriptionOptionsInit): Promise<PushSubscription>;
  }

  interface PushSubscription {
    endpoint: string;
    toJSON(): PushSubscriptionJSON;
    unsubscribe(): Promise<boolean>;
  }

  interface PushSubscriptionJSON {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  }

  interface PushSubscriptionOptionsInit {
    userVisibleOnly?: boolean;
    applicationServerKey?: ArrayBuffer | Uint8Array;
  }
}
