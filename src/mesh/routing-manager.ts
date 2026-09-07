import { MeshPacket, BROADCAST } from './protocol';

export class RoutingManager {
  private seenMessages = new Map<string, number>();

  // Returns true if the message is new (not seen), and adds it to the cache
  isNewMessage(packetId: string): boolean {
    if (this.seenMessages.has(packetId)) {
      return false;
    }
    this.seenMessages.set(packetId, Date.now());
    this.cleanup();
    return true;
  }

  private cleanup() {
    // Keep max 1000 messages or 5 min expiry to prevent memory leak
    if (this.seenMessages.size > 1000) {
      const now = Date.now();
      for (const [id, timestamp] of this.seenMessages.entries()) {
        if (now - timestamp > 5 * 60 * 1000) {
          this.seenMessages.delete(id);
        }
      }
    }
  }

  shouldDeliverLocally(packet: MeshPacket, myNodeId: string): boolean {
    return packet.destination === BROADCAST || packet.destination === myNodeId;
  }

  shouldForward(packet: MeshPacket, myNodeId: string): boolean {
    if (packet.ttl <= 1) return false; // Will decrement to 0, no point forwarding
    if (packet.destination !== BROADCAST && packet.destination === myNodeId) {
      return false; // I am the final destination
    }
    return true;
  }
}
