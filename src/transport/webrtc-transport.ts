import { Transport, TransportEvents } from './transport';
import LZString from 'lz-string';
interface Connection {
  pc: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

export class WebRTCTransport implements Transport {
  private connections = new Map<string, Connection>();
  private events?: TransportEvents;

  // Adding a public STUN server helps force Android Chrome to gather local IP addresses
  // even on a Mobile Hotspot. If the device is truly offline, this fails silently,
  // but still triggers the local candidate gathering process.
  private config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  setEventHandlers(events: TransportEvents): void {
    this.events = events;
  }

  private pendingPc: RTCPeerConnection | null = null;
  private pendingDataChannel: RTCDataChannel | null = null;
  private pendingPeerId: string | null = null;

  async createOffer(): Promise<string> {
    const pc = new RTCPeerConnection(this.config);
    const dataChannel = pc.createDataChannel('mesh', { ordered: true });
    
    this.pendingPc = pc;
    this.pendingDataChannel = dataChannel;
    
    return new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          resolve(LZString.compressToEncodedURIComponent(JSON.stringify(pc.localDescription)));
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    });
  }

  // The Joiner calls this after scanning the Host's offer. The Joiner knows the Host's true peerId.
  async handleOffer(offerData: string, peerId: string): Promise<string> {
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

  // The Host calls this after scanning the Joiner's answer. The Host knows the Joiner's true peerId.
  async handleAnswer(answerData: string, peerId: string): Promise<void> {
     if (!this.pendingPc) {
       throw new Error("No pending offer found to accept answer for.");
     }
     
     const answerDesc = JSON.parse(LZString.decompressFromEncodedURIComponent(answerData) || '{}');
     const pc = this.pendingPc;
     const dataChannel = this.pendingDataChannel;
     
     await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
     
     // Now that we know the true peerId, we can set up the DataChannel and ICE events!
     if (dataChannel) {
       this.setupPeerConnection(pc, peerId, dataChannel);
       this.connections.set(peerId, { pc, dataChannel });
     }
     
     this.pendingPc = null;
     this.pendingDataChannel = null;
  }

  // ... MVP methods ...
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
    return this.handleOffer(offerData, peerId);
  }

  private setupPeerConnection(pc: RTCPeerConnection, peerId: string, dataChannel?: RTCDataChannel) {
    if (dataChannel) {
      this.setupDataChannel(dataChannel, peerId);
    }

    pc.ondatachannel = (event) => {
      (pc as any)._dataChannel = event.channel;
      this.setupDataChannel(event.channel, peerId);
      // If the connection was already mapped without a channel, update it
      const conn = this.connections.get(peerId);
      if (conn) {
        conn.dataChannel = event.channel;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this.disconnect(peerId);
      }
    };
  }

  private setupDataChannel(dc: RTCDataChannel, peerId: string) {
    dc.binaryType = 'arraybuffer';
    
    dc.onopen = () => {
      this.events?.onPeerConnected(peerId);
    };
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
      if (conn.dataChannel && conn.dataChannel.readyState === 'open') {
        connected.push(peerId);
      }
    }
    return connected;
  }
}
