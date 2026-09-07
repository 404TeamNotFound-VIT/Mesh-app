import { useState } from 'react';
import { useMesh } from '../context/MeshContext';
import { PeerList } from '../components/PeerList';
import { QRDisplay } from '../components/QRDisplay';
import { QRScannerWrapper } from '../qr/scan';
import { useNavigate } from 'react-router-dom';

export function NetworkDashboard() {
  const { meshId, nodeId, peers, meshManager } = useMesh();
  const [showInviteQR, setShowInviteQR] = useState(false);
  const [offerData, setOfferData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  if (!meshId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full">
        <p className="text-slate-400 mb-4">You are not connected to any network.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 rounded-lg">Go Home</button>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!meshManager) return;
    const offer = await meshManager.generateOffer();
    setOfferData(offer);
    setShowInviteQR(true);
    setIsScanning(false);
  };

  const handleScannedAnswer = async (data: string) => {
    if (!meshManager) return;
    await meshManager.handleScannedAnswer(data, "pending_peer_new");
    setShowInviteQR(false);
    setIsScanning(false);
  };

  return (
    <div className="p-4 flex flex-col h-full space-y-6 max-w-md mx-auto relative pb-24">
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Network</p>
          <p className="text-lg font-bold text-slate-100">{meshId}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-400">{peers.length}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Peers</p>
        </div>
      </div>

      <button 
        onClick={handleInvite}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
      >
        <span className="text-xl">📱</span>
        <span>Show QR to Add New Device</span>
      </button>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1">Connected Peers</h3>
        <PeerList peers={peers} myNodeId={nodeId!} />
      </div>

      {showInviteQR && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-2">Invite Device</h3>
          <p className="text-sm text-slate-400 mb-6 text-center">Have the other device scan this code</p>
          
          <QRDisplay data={offerData} />
          
          <button 
            onClick={() => setIsScanning(true)} 
            className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg text-sm w-full max-w-xs"
          >
            I'm ready to scan their answer
          </button>
          
          <button 
            onClick={() => { setShowInviteQR(false); setIsScanning(false); }} 
            className="mt-4 text-slate-400 hover:text-slate-200 text-sm"
          >
            Cancel
          </button>

          {isScanning && (
            <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-6">
              <h3 className="text-lg font-bold mb-4">Scan their Answer QR</h3>
              <QRScannerWrapper onScan={handleScannedAnswer} />
              <button onClick={() => setIsScanning(false)} className="mt-6 text-slate-400">Cancel Scan</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
