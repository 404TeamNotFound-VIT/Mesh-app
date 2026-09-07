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
  createOffer(): Promise<string>;
  handleOffer(offerData: string): Promise<string>;
  handleAnswer(answerData: string, peerId: string): Promise<void>;
  send(peerId: string, data: Uint8Array): Promise<void>;
  disconnect(peerId: string): void;
  getConnectedPeers(): string[];
  setEventHandlers(events: TransportEvents): void;
}
