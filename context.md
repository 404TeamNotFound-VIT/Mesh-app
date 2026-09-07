# OfflineMesh — Project Context & Setup Guide

## Quick Start

```bash
# 1. Navigate to project directory
cd e:\Weather-GPT\v1

# 2. Create Vite + React + TypeScript project
npx -y create-vite@latest ./ --template react-ts

# 3. Install core dependencies
npm install react-router-dom dexie qrcode html5-qrcode vis-network uuid

# 4. Install dev dependencies
npm install -D vite-plugin-pwa @vitejs/plugin-basic-ssl tailwindcss @tailwindcss/vite @types/uuid @types/qrcode

# 5. Start dev server (HTTPS + LAN exposed)
npm run dev
```

---

## Vite Configuration

The `vite.config.ts` must enable three critical features:

1. **HTTPS** — required for PWA service workers and camera access on mobile
2. **LAN exposure** — so mobile devices on the same hotspot can access the dev server
3. **PWA plugin** — for service worker generation and manifest

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),  // Self-signed HTTPS cert for dev
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      devOptions: {
        enabled: true,  // Enable SW in dev mode for testing
      },
      manifest: {
        name: 'OfflineMesh',
        short_name: 'OfflineMesh',
        description: 'Communicate without the Internet',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,      // Expose on all network interfaces (0.0.0.0)
    port: 5173,
    https: {},        // Uses basicSsl plugin's cert
  },
  preview: {
    host: true,
    port: 4173,
    https: {},
  },
});
```

---

## Tailwind CSS Setup

Tailwind v4 uses `@import "tailwindcss"` (via the Vite plugin). No `tailwind.config.js` file needed — configuration is done in CSS using `@theme`.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-mesh-primary: #6366f1;
  --color-mesh-secondary: #8b5cf6;
  --color-mesh-accent: #06b6d4;
  --color-mesh-dark: #0f172a;
  --color-mesh-surface: #1e293b;
  --color-mesh-text: #f8fafc;
  --color-mesh-muted: #94a3b8;
  --color-online: #22c55e;
  --color-suspected: #eab308;
  --color-offline: #6b7280;
}
```

---

## Project Structure

```
e:\Weather-GPT\v1\
├── public/
│   ├── icons/
│   │   ├── icon-192.png          # PWA icon 192x192
│   │   └── icon-512.png          # PWA icon 512x512
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── QRDisplay.tsx
│   │   ├── QRScanner.tsx
│   │   ├── PeerList.tsx
│   │   ├── NetworkGraph.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── StepWizard.tsx
│   │   └── AnimatedBackground.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CreateNetwork.tsx
│   │   ├── JoinNetwork.tsx
│   │   ├── NetworkDashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Settings.tsx
│   │   └── TestPage.tsx
│   │
│   ├── transport/
│   │   ├── transport.ts          # Abstract Transport interface
│   │   ├── webrtc-transport.ts   # WebRTC implementation
│   │   └── signaling.ts         # QR-based signaling helpers
│   │
│   ├── mesh/
│   │   ├── protocol.ts          # Message types, packet structure
│   │   ├── mesh-manager.ts      # Central orchestrator
│   │   ├── peer-manager.ts      # Peer table & heartbeat
│   │   ├── routing-manager.ts   # Controlled flooding + TTL
│   │   └── message-manager.ts   # Store-and-forward, ACKs
│   │
│   ├── storage/
│   │   ├── database.ts          # Dexie DB schema
│   │   ├── identity.ts          # Node ID persistence
│   │   └── messages.ts          # Message CRUD
│   │
│   ├── crypto/
│   │   ├── identity.ts          # ECDSA key generation
│   │   └── encryption.ts        # E2E encryption (Phase 2)
│   │
│   ├── qr/
│   │   ├── generate.ts          # QR code generation
│   │   ├── scan.ts              # QR scanner component logic
│   │   └── signaling-qr.ts     # Signaling data <-> QR
│   │
│   ├── context/
│   │   └── MeshContext.tsx       # React context for mesh state
│   │
│   ├── hooks/
│   │   ├── useMesh.ts
│   │   ├── usePeers.ts
│   │   └── useMessages.ts
│   │
│   ├── utils/
│   │   └── system-links.ts      # OS-specific deep links
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── package.json
└── README.md
```

---

## How to Run & Preview

### Development Mode (with hot reload)

```bash
cd e:\Weather-GPT\v1
npm run dev
```

This starts the Vite dev server with:
- **HTTPS** on `https://localhost:5173`
- **LAN access** on `https://<your-local-ip>:5173`

The terminal output will show your LAN URL, e.g.:

```
  VITE v6.x.x  ready in 500 ms

  ➜  Local:   https://localhost:5173/
  ➜  Network: https://192.168.43.1:5173/   ← Use this on mobile!
```

### Production Preview (built assets)

```bash
npm run build
npm run preview
```

This builds optimized production assets and serves them. The preview server also uses HTTPS and LAN exposure (configured in `vite.config.ts`).

---

## Testing on Mobile Devices (Critical Setup)

### Step 1: Find Your Computer's Local IP

```powershell
# Windows PowerShell
ipconfig
# Look for "Wireless LAN adapter Wi-Fi" → "IPv4 Address"
# Or if your PC is the hotspot, look for the hotspot adapter IP
```

Common hotspot IPs:
- Android hotspot host: `192.168.43.1`
- Windows hotspot: `192.168.137.1`
- If PC is connected to Android hotspot: `192.168.43.x`

### Step 2: Access from Mobile Browser

On your mobile device (connected to the same network):

```
https://<your-pc-ip>:5173
```

Example: `https://192.168.43.100:5173`

### Step 3: Accept the Self-Signed Certificate Warning

Since we use `@vitejs/plugin-basic-ssl` (self-signed cert), browsers will show a warning:

**Android Chrome:**
1. You'll see "Your connection is not private"
2. Tap **"Advanced"**
3. Tap **"Proceed to 192.168.x.x (unsafe)"**

**iPhone Safari:**
1. You'll see "This Connection Is Not Private"
2. Tap **"Show Details"**
3. Tap **"visit this website"**
4. Tap **"Visit Website"** in the confirmation dialog

> ⚠️ This is safe — it's your own local dev server with a self-signed certificate. Production deployment would use a real certificate.

### Step 4: PWA Install on Mobile

After accepting the certificate and loading the page:

**Android Chrome (Install Prompt):**
1. Chrome shows a banner: **"Add OfflineMesh to Home screen"**
2. Or: tap the **⋮ menu** → **"Install app"** or **"Add to Home screen"**
3. The PWA will install and appear as an app icon on your home screen
4. Launching it opens in standalone mode (no browser UI)

**iPhone Safari (Add to Home Screen):**
1. Tap the **Share button** (square with arrow) at the bottom
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"**
4. The PWA will appear on your home screen
5. Launching it opens in standalone mode

> **Important**: For the PWA install prompt to appear, these must be true:
> - Page served over HTTPS ✅ (our basicSsl plugin handles this)
> - Valid `manifest.json` with required fields ✅ (vite-plugin-pwa generates this)
> - Service worker registered ✅ (vite-plugin-pwa + `devOptions.enabled: true`)
> - User has interacted with the page ✅

### Step 5: Verify Offline Capability

1. Install the PWA on your phone
2. Close the PWA
3. Turn on **Airplane Mode** on the phone
4. Open the PWA from the home screen
5. The app should still load and show the home screen
6. All previously cached data (messages, identity) should be available

---

## System Settings Deep Links

The app needs to help users open their phone's Wi-Fi and Hotspot settings:

### Android Chrome — Wi-Fi Settings

```ts
window.location.href = 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end';
```

### Android Chrome — Hotspot/Tethering Settings

```ts
window.location.href = 'intent:#Intent;action=android.settings.TETHERING_SETTINGS;end';
```

### iOS Safari — Limited Support

iOS Safari does **not** reliably support deep-linking to Settings. The app should show manual instructions:

```ts
// Attempt (works on older iOS versions, inconsistent on newer):
window.location.href = 'App-Prefs:WIFI';

// Recommended: show instructions modal instead
```

### Implementation Pattern

```ts
// src/utils/system-links.ts

export function openWifiSettings(): boolean {
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end';
    return true;
  }

  if (isIOS) {
    // Show fallback UI with instructions
    return false; // Caller should show manual instructions
  }

  return false;
}

export function openHotspotSettings(): boolean {
  const isAndroid = /android/i.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = 'intent:#Intent;action=android.settings.TETHERING_SETTINGS;end';
    return true;
  }

  return false; // Show manual instructions for iOS/other
}
```

---

## WebRTC on Local Network — Key Configuration

When both devices are on the same Wi-Fi hotspot with no internet:

```ts
// NO STUN/TURN servers needed for local network
const config: RTCConfiguration = {
  iceServers: [],  // Empty! Local candidates only.
};

const pc = new RTCPeerConnection(config);
```

**Why this works**: Without STUN servers, the browser only generates "host" ICE candidates — these are the device's local IP addresses on the LAN. Since both devices are on the same LAN (the hotspot), host candidates are sufficient.

### SDP Offer/Answer Size

A typical SDP offer with ICE candidates is 1–3 KB. QR codes can encode up to ~4KB at error correction level L. We target 2KB with:
- Stripping unnecessary SDP lines
- Using shortened JSON keys
- Base64 encoding the compressed payload

If the payload exceeds QR capacity, the app chunks it into multiple sequential QR codes.

---

## Firewall Configuration (Windows Dev Machine)

If serving the dev server from a Windows PC to mobile devices:

```powershell
# Allow inbound connections on port 5173 (dev) and 4173 (preview)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
New-NetFirewallRule -DisplayName "Vite Preview Server" -Direction Inbound -Protocol TCP -LocalPort 4173 -Action Allow
```

---

## Key Code Snippets

### Dexie Database Schema

```ts
// src/storage/database.ts
import Dexie, { type Table } from 'dexie';

export interface Identity {
  id: string;          // Always "self"
  nodeId: string;      // UUIDv4
  displayName: string;
  publicKey?: JsonWebKey;
  privateKey?: JsonWebKey;
  createdAt: number;
}

export interface MeshMessage {
  id: string;
  meshId: string;
  source: string;
  destination: string;
  type: string;
  payload: unknown;
  timestamp: number;
  status: 'sent' | 'delivered' | 'pending' | 'failed';
  ttl: number;
}

export interface PeerRecord {
  nodeId: string;
  displayName: string;
  meshId: string;
  lastSeen: number;
  publicKey?: JsonWebKey;
}

export interface MeshRecord {
  meshId: string;
  name: string;
  role: 'host' | 'node';
  createdAt: number;
}

export class OfflineMeshDB extends Dexie {
  identity!: Table<Identity>;
  messages!: Table<MeshMessage>;
  peers!: Table<PeerRecord>;
  meshes!: Table<MeshRecord>;

  constructor() {
    super('OfflineMeshDB');
    this.version(1).stores({
      identity: 'id',
      messages: 'id, meshId, timestamp, status, destination',
      peers: 'nodeId, meshId, lastSeen',
      meshes: 'meshId, createdAt',
    });
  }
}

export const db = new OfflineMeshDB();
```

### Transport Interface

```ts
// src/transport/transport.ts
export interface PeerInfo {
  nodeId: string;
  displayName?: string;
  signalingData?: string;
}

export interface TransportEvents {
  onMessage: (peerId: string, data: Uint8Array) => void;
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string) => void;
  onError: (peerId: string, error: Error) => void;
}

export interface Transport {
  connect(peer: PeerInfo): Promise<void>;
  send(peerId: string, data: Uint8Array): Promise<void>;
  disconnect(peerId: string): void;
  getConnectedPeers(): string[];
  createOffer(): Promise<string>;
  handleOffer(data: string): Promise<string>;
  handleAnswer(data: string): Promise<void>;
  setEventHandlers(events: TransportEvents): void;
}
```

### Mesh Packet Protocol

```ts
// src/mesh/protocol.ts
export enum MessageType {
  PEER_HELLO = 'PEER_HELLO',
  PEER_GOODBYE = 'PEER_GOODBYE',
  HEARTBEAT = 'HEARTBEAT',
  HEARTBEAT_ACK = 'HEARTBEAT_ACK',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  SIGNALING_RELAY = 'SIGNALING_RELAY',
  ROUTE_UPDATE = 'ROUTE_UPDATE',
  NODE_DISCOVERY = 'NODE_DISCOVERY',
  ACK = 'ACK',
  ERROR = 'ERROR',
  FILE_META = 'FILE_META',
  FILE_CHUNK = 'FILE_CHUNK',
  FILE_COMPLETE = 'FILE_COMPLETE',
}

export interface MeshPacket {
  id: string;
  meshId: string;
  source: string;
  destination: string;
  ttl: number;
  timestamp: number;
  type: MessageType;
  payload: unknown;
  hopPath?: string[];
  signature?: string;
}

export const DEFAULT_TTL = 5;
export const BROADCAST = 'broadcast';
```

---

## Browser Compatibility Matrix

| Platform | Browser | WebRTC | Camera (QR) | Service Worker | PWA Install |
|---|---|---|---|---|---|
| Android | Chrome 90+ | ✅ | ✅ | ✅ | ✅ (banner) |
| iOS | Safari 15+ | ✅ | ✅ | ✅ | ✅ (manual add) |
| Windows | Chrome/Edge | ✅ | ✅ | ✅ | ✅ |
| macOS | Chrome/Safari | ✅ | ✅ | ✅ | ✅ |

---

## Troubleshooting

### "Can't access dev server from mobile"
1. Check both devices are on the same network
2. Check Windows Firewall allows port 5173
3. Use `https://` not `http://` in the URL
4. Make sure `server.host: true` is set in vite.config.ts

### "PWA install option doesn't appear"
1. Must be served over HTTPS
2. Must have a valid manifest with at least one 192px icon
3. Service worker must be registered (check `devOptions.enabled: true`)
4. On iOS: use Share → "Add to Home Screen" (no automatic prompt)
5. Try clearing browser cache and reloading

### "WebRTC connection fails on local hotspot"
1. Ensure `iceServers: []` — don't try to reach public STUN
2. Check that both devices have IP addresses on the same subnet
3. Open browser console: look for ICE candidate gathering events
4. If no host candidates appear: check browser privacy settings
5. On iOS Safari: ensure "Prevent Cross-Site Tracking" isn't blocking WebRTC

### "Camera doesn't work for QR scanning"
1. HTTPS is required for camera access — ensure you accepted the cert
2. Check camera permissions in browser settings
3. On iOS: Settings → Safari → Camera → Allow
4. Try switching front/back camera

### "Service worker not caching in dev mode"
1. Ensure `devOptions: { enabled: true }` in VitePWA config
2. Open DevTools → Application → Service Workers → check status
3. Try "Update on reload" checkbox in DevTools
