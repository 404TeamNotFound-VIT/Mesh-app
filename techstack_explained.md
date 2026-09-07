# Tech Stack and Architecture Logic Explained

## Overview
OfflineMesh is designed to allow local communication without relying on the internet, using a decentralized mesh-like architecture over a local network.

## 1. Core Framework: React 18 + TypeScript + Vite 6
- **React**: Provides a component-based UI that handles state well.
- **TypeScript**: Ensures type safety across the application.
- **Vite**: Ultra-fast build tool and dev server. We use `@vitejs/plugin-basic-ssl` to serve the app over HTTPS locally, which is required for Service Workers (PWAs) and Camera access (QR Codes).

## 2. Progressive Web App (PWA): vite-plugin-pwa (Workbox)
- **Why**: Allows users to "install" the web app to their home screens, enabling it to open in standalone mode and, most crucially, cache its resources for **offline** usage.
- **Logic**: The Service Worker caches `index.html`, CSS, JS, and assets. When the device is offline, it loads the UI directly from the cache.

## 3. Styling: Tailwind CSS v4
- **Why**: Utility-first CSS allows for rapid UI development and a cohesive design system. We use CSS variables for theming to build a premium glassmorphic dark mode.

## 4. Storage: IndexedDB via Dexie.js
- **Why**: LocalStorage is synchronous and has small limits. IndexedDB handles larger data asynchronously. `Dexie.js` wraps IndexedDB in a friendly Promise-based API.
- **Usage**: We store Node Identity, Peer Lists, Chat Messages, and Network Configurations. This ensures messages are persisted across app restarts and network drops.

## 5. WebRTC DataChannels (Native API)
- **Why**: WebRTC allows direct peer-to-peer (P2P) communication in the browser. The `RTCDataChannel` API allows arbitrary data transfer (JSON, binary).
- **Logic**:
  - We configure `iceServers: []` (empty array). This forces WebRTC to use **host candidates** (local LAN IP addresses) instead of public STUN/TURN servers.
  - As long as devices are on the same local network (Wi-Fi router, phone hotspot), they can discover each other via these host candidates.

## 6. QR Code Signaling (qrcode & html5-qrcode)
- **Why**: WebRTC normally requires a signaling server (on the internet) to exchange Session Description Protocol (SDP) and ICE candidates to initiate a connection. Since we are offline, we must signal out-of-band.
- **Logic**:
  - Device A generates an Offer (SDP + ICE) and encodes it into a QR code.
  - Device B scans the QR code, parses the Offer, and generates an Answer.
  - Device B displays its Answer as a QR code.
  - Device A scans the Answer. Handshake complete!

## 7. Mesh Protocol (Custom)
- **Why**: WebRTC connections are direct P2P (A to B). If A wants to talk to C, they either need a direct connection, or B needs to relay the message.
- **Logic**:
  - **Controlled Flooding**: When a message is sent to "broadcast", the sender sends it to all directly connected peers. Each peer receives it, delivers it locally to the UI, and if its Time-To-Live (TTL) is > 0, it decrements the TTL and forwards it to its connected peers.
  - **Duplicate Detection**: Every message has a unique `id`. Nodes keep a cache of `seenMessages`. If a message arrives that's already in the cache, it's discarded to prevent infinite routing loops.
  - **Peer Announcement**: When B onboards C (via QR), B sends a `PEER_ANNOUNCEMENT` to A. Now A knows C exists in the mesh.

## 8. Unique IDs: uuid (v4)
- Used to uniquely identify devices (`nodeId`), networks (`meshId`), and messages (`messageId`), preventing collisions in a decentralized system.
