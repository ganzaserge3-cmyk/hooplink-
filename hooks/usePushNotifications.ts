"use client";

import { useEffect, useRef, useState } from "react";

import { registerPushDevice } from "@/lib/notifications";

type PushNotificationState = {
  supported: boolean;
  permission: NotificationPermission | null;
  token: string | null;
  error: string | null;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    supported: typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window,
    permission: null,
    token: null,
    error: null,
  });

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!state.supported) return;

    setState((prev) => ({
      ...prev,
      permission: Notification.permission,
    }));

    const savedToken = localStorage.getItem("hooplink_push_token");
    if (savedToken) {
      setState((prev) => ({
        ...prev,
        token: savedToken,
      }));
    }
  }, [state.supported]);

  const requestPermission = async () => {
    if (!state.supported) {
      setState((prev) => ({
        ...prev,
        error: "Push notifications are not supported in this browser.",
      }));
      return null;
    }

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.");
      }

      const permission = await Notification.requestPermission();
      setState((prev) => ({
        ...prev,
        permission,
        error: permission === "denied" ? "Notification permission was denied." : null,
      }));

      if (permission !== "granted") {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      registrationRef.current = registration;

      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const token = JSON.stringify(subscription);
      localStorage.setItem("hooplink_push_token", token);

      await registerPushDevice({
        label: navigator.userAgent.includes("Mobile") ? "Phone" : "Browser",
        token,
        platform: navigator.userAgent,
      });

      setState((prev) => ({
        ...prev,
        token,
        error: null,
      }));

      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enable push notifications.";
      setState((prev) => ({
        ...prev,
        error: message,
      }));
      return null;
    }
  };

  const unregister = async () => {
    if (!registrationRef.current && "serviceWorker" in navigator) {
      registrationRef.current = await navigator.serviceWorker.ready.catch(() => null);
    }
    if (!registrationRef.current) return;

    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      localStorage.removeItem("hooplink_push_token");
      setState((prev) => ({
        ...prev,
        token: null,
      }));
    } catch (error) {
      console.error("Failed to unregister push notifications:", error);
    }
  };

  return {
    ...state,
    requestPermission,
    unregister,
  };
}