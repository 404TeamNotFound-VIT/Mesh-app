export enum MessageType {
  PEER_HELLO = 'PEER_HELLO',
  PEER_GOODBYE = 'PEER_GOODBYE',
  HEARTBEAT = 'HEARTBEAT',
  HEARTBEAT_ACK = 'HEARTBEAT_ACK',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  PEER_ANNOUNCEMENT = 'PEER_ANNOUNCEMENT',
  ACK = 'ACK',
}

export interface MeshPacket {
  id: string;
  meshId: string;
  source: string;
  destination: string; // nodeId or "broadcast"
  ttl: number;
  timestamp: number;
  type: MessageType;
  payload: any;
}

export const DEFAULT_TTL = 5;
export const BROADCAST = 'broadcast';
