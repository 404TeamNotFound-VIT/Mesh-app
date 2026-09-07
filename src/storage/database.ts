import Dexie, { type Table } from 'dexie';

export interface Identity {
  id: string; // "self"
  nodeId: string;
  displayName: string;
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
