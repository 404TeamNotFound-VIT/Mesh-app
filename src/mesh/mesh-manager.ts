import { Transport } from '../transport/transport';
import { PeerManager } from './peer-manager';
import { RoutingManager } from './routing-manager';
import { MeshPacket, MessageType, DEFAULT_TTL, BROADCAST } from './protocol';
import { v4 as uuidv4 } from 'uuid';
import LZString from 'lz-string';

type MeshEventListener = (event: string, data: any) => void;

export class MeshManager {
  private listeners = new Map<string, Set<MeshEventListener>>();
  public meshId: string | null = null;
  public nodeId: string | null = null;

  constructor(
    private transport: Transport,
    public peerManager: PeerManager,
    private routingManager: RoutingManager
  ) {
    this.transport.setEventHandlers({
      onMessage: this.handleTransportMessage.bind(this),
      onPeerConnected: this.handlePeerConnected.bind(this),
      onPeerDisconnected: this.handlePeerDisconnected.bind(this),
      onError: (peerId, error) => console.error(`Transport error for ${peerId}:`, error),
    });
  }

  init(nodeId: string) {
    this.nodeId = nodeId;
  }

  createNetwork(name: string) {
    this.meshId = `mesh_${uuidv4().substring(0, 8)}`;
    this.emit('networkCreated', { meshId: this.meshId, name });
  }

  async generateOffer(): Promise<string> {
    const offer = await this.transport.createOffer();
    return LZString.compressToEncodedURIComponent(JSON.stringify({ meshId: this.meshId, nodeId: this.nodeId, sdp: offer }));
  }

  async handleScannedOffer(qrData: string): Promise<string> {
    const data = JSON.parse(LZString.decompressFromEncodedURIComponent(qrData) || '{}');
    this.meshId = data.meshId;
    this.emit('networkJoined', { meshId: this.meshId });
    // Pass the Host's true nodeId to the transport layer
    const answerSdp = await this.transport.handleOffer(data.sdp, data.nodeId);
    return LZString.compressToEncodedURIComponent(JSON.stringify({ nodeId: this.nodeId, sdp: answerSdp }));
  }

  async handleScannedAnswer(qrData: string): Promise<void> {
    const data = JSON.parse(LZString.decompressFromEncodedURIComponent(qrData) || '{}');
    // Pass the Joiner's true nodeId to the transport layer
    await this.transport.handleAnswer(data.sdp, data.nodeId);
  }

  private handlePeerConnected(peerId: string) {
    // We send a HELLO to introduce ourselves
    this.sendDirect(peerId, MessageType.PEER_HELLO, { displayName: `Peer_${peerId.substring(0, 4)}` });
  }

  private handlePeerDisconnected(peerId: string) {
    this.peerManager.removePeer(peerId);
    this.emit('peerLeft', peerId);
  }

  public disconnectAll() {
    const peers = this.transport.getConnectedPeers();
    for (const peer of peers) {
      this.transport.disconnect(peer);
    }
    this.peerManager.clear();
    this.meshId = null;
    this.emit('networkDisconnected');
  }

  private handleTransportMessage(peerId: string, data: Uint8Array) {
    try {
      const text = new TextDecoder().decode(data);
      const packet = JSON.parse(text) as MeshPacket;

      if (!this.routingManager.isNewMessage(packet.id)) return;

      this.peerManager.updatePeerSeen(peerId); // The sender is alive

      if (this.routingManager.shouldDeliverLocally(packet, this.nodeId!)) {
        this.processPacketLocally(packet, peerId);
      }

      if (this.routingManager.shouldForward(packet, this.nodeId!)) {
        packet.ttl -= 1;
        this.forwardPacket(packet, peerId); // Don't send back to the one who sent it to us
      }
    } catch (e) {
      console.error('Failed to handle message', e);
    }
  }

  private processPacketLocally(packet: MeshPacket, peerId: string) {
    switch (packet.type) {
      case MessageType.PEER_HELLO:
        this.peerManager.addPeer(packet.source, packet.payload.displayName);
        this.emit('peerJoined', packet.source);
        // Announce this new peer to others
        this.broadcastMessage(MessageType.PEER_ANNOUNCEMENT, { newPeerId: packet.source, displayName: packet.payload.displayName });
        break;
      case MessageType.PEER_ANNOUNCEMENT:
        // Indirect peer discovery
        if (!this.peerManager.getPeer(packet.payload.newPeerId)) {
          this.peerManager.addPeer(packet.payload.newPeerId, packet.payload.displayName);
        }
        break;
      case MessageType.CHAT_MESSAGE:
        this.emit('message', packet);
        break;
    }
  }

  public broadcastMessage(type: MessageType, payload: any) {
    const packet: MeshPacket = {
      id: uuidv4(),
      meshId: this.meshId!,
      source: this.nodeId!,
      destination: BROADCAST,
      ttl: DEFAULT_TTL,
      timestamp: Date.now(),
      type,
      payload,
    };
    this.routingManager.isNewMessage(packet.id); // Add to my own cache
    this.forwardPacket(packet);
    if (type === MessageType.CHAT_MESSAGE) {
      this.emit('message', packet); // Emit locally so UI updates
    }
  }

  private sendDirect(peerId: string, type: MessageType, payload: any) {
    const packet: MeshPacket = {
      id: uuidv4(),
      meshId: this.meshId!,
      source: this.nodeId!,
      destination: peerId,
      ttl: 1, // Direct only
      timestamp: Date.now(),
      type,
      payload,
    };
    const data = new TextEncoder().encode(JSON.stringify(packet));
    this.transport.send(peerId, data).catch(console.error);
  }

  private forwardPacket(packet: MeshPacket, excludePeerId?: string) {
    const data = new TextEncoder().encode(JSON.stringify(packet));
    const peers = this.transport.getConnectedPeers();
    for (const peer of peers) {
      if (peer !== excludePeerId) {
        this.transport.send(peer, data).catch(console.error);
      }
    }
  }

  // Simple event emitter
  on(event: string, listener: MeshEventListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)!.delete(listener);
  }

  private emit(event: string, data?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(l => l(event, data));
    }
  }
}
