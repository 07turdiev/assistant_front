# Smart assistant — Frontend

Vue 3 + TypeScript + Vite + Pinia + Element Plus.

Backend: Django + DRF + Channels (`/assistant_back`).

## Talablar

- Node.js >= 20
- npm >= 10

## O'rnatish

```bash
npm install
```

## Lokal ishga tushirish

```bash
npm run dev
```

Vite dev server `http://localhost:5173` da ishga tushadi. Backend `http://localhost:8081` ga proxy qilingan (vite.config.ts):

- `/api/*` → backend REST
- `/admin/*` → Django admin (Jazzmin)
- `/static/*`, `/media/*` → Django static/media
- `/ws/*` → WebSocket (Django Channels)

`.env.development` da `VITE_API_PROXY_TARGET` orqali manzilni o'zgartirish mumkin.

## Build

```bash
npm run build
```

`dist/` papkasiga static fayllar tayyorlanadi. Ularni Nginx orqali serv qiling.

## Strukturasi

```
src/
├── api/          # axios client + endpoint modullari
├── assets/       # styles, images
├── components/
│   ├── common/
│   ├── layout/
│   └── notification/
├── composables/  # useAppWebSocket, useWebPush
├── i18n/         # vue-i18n setup
├── layouts/      # AuthLayout, DefaultLayout
├── locales/      # uz.json, ru.json
├── router/       # routes, guards
├── stores/       # Pinia: auth, lookup, notifications, chat, webpush
├── types/        # TypeScript interfaces
├── utils/        # date, format, permissions
└── views/        # sahifalar
public/
├── sw.js                    # Service Worker (Web Push)
└── manifest.webmanifest     # PWA manifest
```

## Web Push

Login'dan keyin foydalanuvchiga `WebPushBanner` ko'rsatiladi. "Yoqish" tugmasi:

1. `Notification.requestPermission()` so'raydi
2. `GET /api/webpush/vapid-public-key/` orqali VAPID public kalitni oladi
3. `pushManager.subscribe(...)` chaqiradi
4. Subscriptionni `POST /api/webpush/subscribe/` ga yuboradi

`/notifications/settings` sahifasida foydalanuvchi qurilmalarini ko'rib, yoqib/o'chira oladi.

Service Worker `public/sw.js` `push` event'ni eshitib, `showNotification(...)` orqali tizim notificationini ko'rsatadi va click'da tegishli URL'ga olib o'tadi.

## i18n

- `src/locales/uz.json`, `src/locales/ru.json`
- Default locale: `localStorage.assistant.locale` yoki brauzer tili
- Header'dagi `LangSwitch` orqali o'zgartirish

## WebSocket

`src/composables/useAppWebSocket.ts` — bitta global socket. Login bo'lganda avtomatik connect, logout'da disconnect.

Kanallar:
- `chat` — yangi xabar (chatStore.pushIncoming)
- `notify` — yangi bildirishnoma (notificationsStore.pushIncoming)
- `report` — yangi task/request

## Test

```bash
npm run test
npm run type-check
```
