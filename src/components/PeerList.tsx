import { PeerEntry } from '../mesh/peer-manager';

export function PeerList({ peers, myNodeId }: { peers: PeerEntry[], myNodeId: string }) {
  if (peers.length === 0) {
    return <div className="text-center text-slate-400 p-4">No peers connected yet.</div>;
  }

  return (
    <div className="space-y-2">
      {peers.map((peer) => (
        <div key={peer.nodeId} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-3">
            <span className={`w-2.5 h-2.5 rounded-full ${peer.connectionState === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <div>
              <p className="font-medium text-sm text-slate-200">{peer.displayName} {peer.nodeId === myNodeId ? '(You)' : ''}</p>
              <p className="text-xs text-slate-500 font-mono">{peer.nodeId.substring(0, 13)}...</p>
            </div>
          </div>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">Connected</span>
        </div>
      ))}
    </div>
  );
}
