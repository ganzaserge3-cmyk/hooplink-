"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setPresence } from "@/lib/settings";

interface AuthUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface AuthStoreState {
  user: AuthUser | null;
  loading: boolean;
}

let authStore: AuthStoreState = {
  user: null,
  loading: true,
};

const subscribers = new Set<() => void>();
let authListenerStarted = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let lastPresenceUid: string | null = null;

function emitAuthChange() {
  subscribers.forEach((listener) => listener());
}

function updateAuthStore(nextState: Partial<AuthStoreState>) {
  authStore = {
    ...authStore,
    ...nextState,
  };
  emitAuthChange();
}

function startAuthListener() {
  if (authListenerStarted) {
    return;
  }

  authListenerStarted = true;

  if (!auth) {
    updateAuthStore({ loading: false, user: null });
    return;
  }

  fallbackTimer = setTimeout(() => {
    updateAuthStore({ loading: false });
  }, 5000);

  onAuthStateChanged(
    auth,
    (currentUser: AuthUser | null) => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      const nextUid = currentUser?.uid ?? null;
      if (lastPresenceUid && lastPresenceUid !== nextUid) {
        void setPresence(false);
      }
      if (nextUid && lastPresenceUid !== nextUid) {
        void setPresence(true);
      }

      lastPresenceUid = nextUid;
      updateAuthStore({
        user: currentUser,
        loading: false,
      });
    },
    () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      updateAuthStore({ loading: false });
    }
  );
}

export function useAuth() {
  startAuthListener();

  return useSyncExternalStore(
    (listener) => {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    () => authStore,
    () => authStore
  );
}

