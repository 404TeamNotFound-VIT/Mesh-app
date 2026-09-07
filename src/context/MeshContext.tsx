import { createContext, useContext, useEffect, useState } from 'react';
import { MeshManager } from '../mesh/mesh-manager';
import { PeerManager, PeerEntry } from '../mesh/peer-manager';
import { RoutingManager } from '../mesh/routing-manager';
import { WebRTCTransport } from '../transport/webrtc-transport';
import { getOrCreateIdentity } from '../storage/identity';
import { saveMessage, getMessagesByMesh } from '../storage/messages';
import { MeshPacket, MessageType } from '../mesh/protocol';

interface MeshContextState {
  meshManager: MeshManager | null;
  peers: PeerEntry[];
  messages: MeshPacket[];
  meshId: string | null;
  nodeId: string | null;
  isConnected: boolean;
}

const MeshContext = createContext<MeshContextState>({
  meshManager: null,
  peers: [],
  messages: [],
  meshId: null,
  nodeId: null,
  isConnected: false,
});

export function MeshProvider({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<MeshManager | null>(null);
  const [peers, setPeers] = useState<PeerEntry[]>([]);
  const [messages, setMessages] = useState<MeshPacket[]>([]);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [meshId, setMeshId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const identity = await getOrCreateIdentity();
      setNodeId(identity.nodeId);

      const transport = new WebRTCTransport();
      const peerManager = new PeerManager();
      const routingManager = new RoutingManager();
      
      const mesh = new MeshManager(transport, peerManager, routingManager);
      mesh.init(identity.nodeId);

      peerManager.subscribe((peerMap) => {
        setPeers(Array.from(peerMap.values()));
      });

      mesh.on('networkCreated', (_event, data) => setMeshId(data.meshId));
      mesh.on('networkJoined', (_event, data) => setMeshId(data.meshId));
      mesh.on('networkDisconnected', () => {
        setMeshId(null);
        setMessages([]);
      });

      mesh.on('message', (_event, packet: MeshPacket) => {
        setMessages((prev) => [...prev, packet]);
        saveMessage({
          id: packet.id,
          meshId: packet.meshId,
          source: packet.source,
          destination: packet.destination,
          type: packet.type,
          payload: packet.payload,
          timestamp: packet.timestamp,
          status: 'delivered',
          ttl: packet.ttl,
        });
      });

      setManager(mesh);
    }
    init();
  }, []);

  // Reload messages when meshId changes
  useEffect(() => {
    if (meshId) {
       getMessagesByMesh(meshId).then((msgs) => {
          // Convert MeshMessage to MeshPacket for UI
          const packets: MeshPacket[] = msgs.map(m => ({
            ...m,
            type: m.type as MessageType
          }));
          setMessages(packets);
       });
    }
  }, [meshId]);

  return (
    <MeshContext.Provider
      value={{
        meshManager: manager,
        peers,
        messages,
        meshId,
        nodeId,
        isConnected: peers.length > 0,
      }}
    >
      {children}
    </MeshContext.Provider>
  );
}

export function useMesh() {
  return useContext(MeshContext);
}
