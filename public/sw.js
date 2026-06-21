const CACHE_NAME = "hooplink-shell-v1";
const APP_SHELL = ["/", "/feed", "/reels", "/messages", "/search", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  let payload = { title: "HoopLink", body: "You have a new alert.", type: "notification" };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationType = payload.type || "notification";
  let actions = [];
  let tag = `hooplink-${notificationType}`;

  switch (notificationType) {
    case "message":
      actions = [
        { action: "reply", title: "Reply" },
        { action: "view", title: "Open Chat" },
      ];
      tag = `hooplink-message-${payload.actorId || "unknown"}`;
      break;
    case "follow":
      actions = [
        { action: "follow_back", title: "Follow Back" },
        { action: "view", title: "View Profile" },
      ];
      break;
    case "like":
    case "comment":
    case "mention":
      actions = [
        { action: "view", title: "View Post" },
        { action: "like", title: "Like" },
      ];
      break;
    default:
      actions = [
        { action: "view", title: "View" },
      ];
  }

  const notificationOptions = {
    body: payload.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: tag,
    renotify: true,
    vibrate: [200, 100, 200],
    actions: actions,
    data: {
      url: payload.url || "/notifications",
      type: notificationType,
      actorId: payload.actorId,
      postId: payload.postId,
      title: payload.title,
    },
    requireInteraction: notificationType === "message" || notificationType === "follow",
  };

  event.waitUntil(self.registration.showNotification(payload.title, notificationOptions));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  let url = data.url || "/notifications";

  if (action === "follow_back" && data.actorId) {
    url = `/profile/${data.actorId}?action=follow`;
  } else if (action === "view" && data.postId) {
    url = `/feed?post=${data.postId}`;
  } else if (action === "reply" && data.actorId) {
    url = `/messages?user=${data.actorId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      if ("openWindow" in self.clients) {
        return self.clients.openWindow(url);
      }

      return undefined;
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/feed"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseClone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => cached);
    })
  );
});
