import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMesh } from '../context/MeshContext';
import { QRScannerWrapper } from '../qr/scan';
import { QRDisplay } from '../components/QRDisplay';
import { openWifiSettings } from '../utils/system-links';

export function JoinNetwork() {
  const [step, setStep] = useState(1);
  const [answerData, setAnswerData] = useState('');
  const { meshManager } = useMesh();
  const navigate = useNavigate();

  const handleScanOffer = async (qrData: string) => {
    if (!meshManager) return;
    try {
      const answer = await meshManager.handleScannedOffer(qrData);
      setAnswerData(answer);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Invalid network QR code");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6">Join Network</h2>

      {step === 1 && (
        <div className="space-y-6 flex-1">
          <p className="text-slate-300">Connect to the same Wi-Fi network or Hotspot as the host.</p>
          <button onClick={openWifiSettings} className="w-full p-3 bg-slate-800 rounded-lg hover:bg-slate-700">
            Open Wi-Fi Settings
          </button>
          <button onClick={() => setStep(2)} className="w-full py-3 bg-indigo-600 rounded-lg font-medium mt-auto">
            I'm Connected - Scan QR
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col items-center">
          <p className="mb-6 text-center text-slate-300">Scan the network's QR code.</p>
          <QRScannerWrapper onScan={handleScanOffer} />
          
          <button 
            onClick={() => {
              const offer = prompt("Paste the Offer Code here:");
              if (offer) {
                handleScanOffer(offer);
              }
            }}
            className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm w-full max-w-sm"
          >
            Or Paste Offer Code
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col items-center">
          <p className="mb-6 text-center text-slate-300">Show this Answer QR to the person who invited you.</p>
          {answerData ? (
            <div className="flex flex-col items-center w-full">
              <QRDisplay data={answerData} />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(answerData);
                  alert("Answer Code copied to clipboard!");
                }}
                className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm w-full max-w-sm"
              >
                Or Copy Answer Code
              </button>
            </div>
          ) : (
            <div className="animate-pulse h-64 w-64 bg-slate-800 rounded-xl"></div>
          )}
          
          <div className="mt-8 flex flex-col gap-3 w-full max-w-sm">
            <button onClick={() => navigate('/network')} className="w-full py-3 bg-indigo-600 rounded-lg font-medium">
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
