export interface PeerEntry {
  nodeId: string;
  displayName: string;
  connectionState: 'online' | 'suspected' | 'offline';
  lastSeen: number;
}

export class PeerManager {
  private peers = new Map<string, PeerEntry>();
  private listeners: ((peers: Map<string, PeerEntry>) => void)[] = [];

  addPeer(nodeId: string, displayName: string) {
    this.peers.set(nodeId, {
      nodeId,
      displayName,
      connectionState: 'online',
      lastSeen: Date.now(),
    });
    this.notify();
  }

  removePeer(nodeId: string) {
    this.peers.delete(nodeId);
    this.notify();
  }

  updatePeerSeen(nodeId: string) {
    const peer = this.peers.get(nodeId);
    if (peer) {
      peer.lastSeen = Date.now();
      peer.connectionState = 'online';
      this.notify();
    }
  }

  getPeer(nodeId: string): PeerEntry | undefined {
    return this.peers.get(nodeId);
  }

  getAllPeers(): PeerEntry[] {
    return Array.from(this.peers.values());
  }

  clear() {
    this.peers.clear();
    this.notify();
  }

  subscribe(listener: (peers: Map<string, PeerEntry>) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(new Map(this.peers)));
  }
}
