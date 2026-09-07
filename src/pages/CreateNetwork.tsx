import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMesh } from '../context/MeshContext';
import { QRDisplay } from '../components/QRDisplay';
import { QRScannerWrapper } from '../qr/scan';
import { openWifiSettings, openHotspotSettings } from '../utils/system-links';

export function CreateNetwork() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [qrData, setQrData] = useState('');
  const { meshManager } = useMesh();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name || !meshManager) return;
    meshManager.createNetwork(name);
    setStep(2);
  };

  const handleGenerateOffer = async () => {
    if (!meshManager) return;
    const offerData = await meshManager.generateOffer();
    setQrData(offerData);
    setStep(3);
  };

  const [isConnecting, setIsConnecting] = useState(false);

  const handleScannedAnswer = async (data: string) => {
    if (!meshManager) return;
    setIsConnecting(true);
    await meshManager.handleScannedAnswer(data);
    
    // Give a short delay so the user sees the connection success message before navigating
    setTimeout(() => {
      navigate('/network');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-md mx-auto h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6">Create Network</h2>
      
      {step === 1 && (
        <div className="space-y-4 flex-1">
          <label className="block text-sm font-medium text-slate-400">Network Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-indigo-500"
            placeholder="e.g., Campus-Mesh"
          />
          <button 
            onClick={handleCreate}
            disabled={!name}
            className="w-full py-3 bg-indigo-600 disabled:opacity-50 rounded-lg font-medium"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 flex-1">
          <p className="text-slate-300">Ensure you are connected to a shared local network (e.g. Wi-Fi router) or enable your Mobile Hotspot.</p>
          <div className="flex gap-2">
            <button onClick={openWifiSettings} className="flex-1 p-3 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">Open Wi-Fi</button>
            <button onClick={openHotspotSettings} className="flex-1 p-3 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">Open Hotspot</button>
          </div>
          <button onClick={handleGenerateOffer} className="w-full py-3 bg-indigo-600 rounded-lg font-medium mt-auto">
            I'm Ready - Generate QR
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col items-center">
          <p className="mb-6 text-center text-slate-300">Show this QR to the device joining your network.</p>
          {qrData ? (
            <div className="flex flex-col items-center w-full">
              <QRDisplay data={qrData} />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(qrData);
                  alert("Offer Code copied to clipboard!");
                }}
                className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm w-full max-w-sm"
              >
                Or Copy Offer Code
              </button>
            </div>
          ) : (
            <div className="animate-pulse h-64 w-64 bg-slate-800 rounded-xl"></div>
          )}
          
          <div className="mt-8 w-full border-t border-slate-700 pt-6 flex flex-col items-center">
            {isConnecting ? (
              <div className="flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Connection Established!</h3>
                <p className="text-slate-400">Taking you to the network dashboard...</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-center text-sm text-slate-400">After they scan, scan their Answer QR code:</p>
                <QRScannerWrapper onScan={handleScannedAnswer} />
                
                <button 
                  onClick={() => {
                    const answer = prompt("Paste the Answer Code here:");
                    if (answer) {
                      handleScannedAnswer(answer);
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm w-full max-w-sm"
                >
                  Or Paste Answer Code
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
