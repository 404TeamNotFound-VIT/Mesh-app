import { Transport, TransportEvents } from './transport';
import LZString from 'lz-string';
interface Connection {
  pc: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

export class WebRTCTransport implements Transport {
  private connections = new Map<string, Connection>();
  private events?: TransportEvents;

  // We are creating a local network connection, so no STUN/TURN servers are needed.
  // The empty iceServers array forces WebRTC to use local IP addresses (host candidates).
  private config: RTCConfiguration = {
    iceServers: [],
  };

  setEventHandlers(events: TransportEvents): void {
    this.events = events;
  }

  private pendingPc: RTCPeerConnection | null = null;
  private pendingPeerId: string | null = null;

  async createOffer(): Promise<string> {
    const pc = new RTCPeerConnection(this.config);
    const dataChannel = pc.createDataChannel('mesh', { ordered: true });
    
    this.pendingPc = pc;
    // Assume a pending peer ID for now, it can be updated on answer
    this.pendingPeerId = 'pending_peer';
    this.setupPeerConnection(pc, this.pendingPeerId, dataChannel);

    return new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          // Gathering finished
          resolve(LZString.compressToEncodedURIComponent(JSON.stringify(pc.localDescription)));
        }
      };
      
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    });
  }

  async handleOffer(offerData: string): Promise<string> {
    const offerDesc = JSON.parse(LZString.decompressFromEncodedURIComponent(offerData) || '{}');
    const pc = new RTCPeerConnection(this.config);
    
    return new Promise((resolve) => {
      this.setupPeerConnection(pc, 'pending_peer'); // Temporary ID
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
           this.connections.set('pending_peer', { pc, dataChannel: (pc as any)._dataChannel });
           resolve(LZString.compressToEncodedURIComponent(JSON.stringify(pc.localDescription)));
        }
      };
      
      pc.setRemoteDescription(new RTCSessionDescription(offerDesc))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer));
    });
  }

  async handleAnswer(answerData: string, peerId: string): Promise<void> {
     if (!this.pendingPc) {
       throw new Error("No pending offer found to accept answer for.");
     }
     
     const answerDesc = JSON.parse(LZString.decompressFromEncodedURIComponent(answerData) || '{}');
     await this.pendingPc.setRemoteDescription(new RTCSessionDescription(answerDesc));
     
     // Once answered, we consider the connection active for this peerId
     // For MVP, we just remap it if peerId changed from 'pending_peer'
     const dataChannel = (this.pendingPc as any)._dataChannel || (this.pendingPc as any).createDataChannel('fallback');
     this.connections.set(peerId, { pc: this.pendingPc, dataChannel });
     this.pendingPc = null;
     this.pendingPeerId = null;
  }

  // Simplified MVP connection setup for peer-to-peer
  async createOfferAndStore(peerId: string): Promise<{ offer: string, pc: RTCPeerConnection }> {
    const pc = new RTCPeerConnection(this.config);
    const dataChannel = pc.createDataChannel('mesh', { ordered: true });
    this.setupPeerConnection(pc, peerId, dataChannel);
    this.connections.set(peerId, { pc, dataChannel });

    return new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          resolve({ offer: LZString.compressToEncodedURIComponent(JSON.stringify(pc.localDescription)), pc });
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    });
  }

  async acceptAnswerForPC(pc: RTCPeerConnection, answerData: string): Promise<void> {
    const answerDesc = JSON.parse(LZString.decompressFromEncodedURIComponent(answerData) || '{}');
    await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
  }

  async handleOfferAndStore(offerData: string, peerId: string): Promise<string> {
    const offerDesc = JSON.parse(LZString.decompressFromEncodedURIComponent(offerData) || '{}');
    const pc = new RTCPeerConnection(this.config);
    
    return new Promise((resolve) => {
      this.setupPeerConnection(pc, peerId);
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
           this.connections.set(peerId, { pc, dataChannel: (pc as any)._dataChannel });
           resolve(LZString.compressToEncodedURIComponent(JSON.stringify(pc.localDescription)));
        }
      };
      
      pc.setRemoteDescription(new RTCSessionDescription(offerDesc))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer));
    });
  }

  private setupPeerConnection(pc: RTCPeerConnection, peerId: string, dataChannel?: RTCDataChannel) {
    if (dataChannel) {
      this.setupDataChannel(dataChannel, peerId);
    }

    pc.ondatachannel = (event) => {
      (pc as any)._dataChannel = event.channel;
      this.setupDataChannel(event.channel, peerId);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this.disconnect(peerId);
      }
    };
  }

  private setupDataChannel(dc: RTCDataChannel, peerId: string) {
    dc.binaryType = 'arraybuffer';
    dc.onopen = () => this.events?.onPeerConnected(peerId);
    dc.onclose = () => this.events?.onPeerDisconnected(peerId);
    dc.onerror = () => this.events?.onError(peerId, new Error("DataChannel error"));
    dc.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.events?.onMessage(peerId, new Uint8Array(event.data));
      } else {
        const encoder = new TextEncoder();
        this.events?.onMessage(peerId, encoder.encode(event.data));
      }
    };
  }

  async send(peerId: string, data: Uint8Array): Promise<void> {
    const conn = this.connections.get(peerId);
    if (conn && conn.dataChannel.readyState === 'open') {
      conn.dataChannel.send(data as any);
    } else {
      throw new Error(`Cannot send to ${peerId}: channel not open`);
    }
  }

  disconnect(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.dataChannel.close();
      conn.pc.close();
      this.connections.delete(peerId);
      this.events?.onPeerDisconnected(peerId);
    }
  }

  getConnectedPeers(): string[] {
    const connected: string[] = [];
    for (const [peerId, conn] of this.connections.entries()) {
      if (conn.dataChannel.readyState === 'open') {
        connected.push(peerId);
      }
    }
    return connected;
  }
}
