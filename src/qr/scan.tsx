import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useState } from 'react';

interface Props {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export function QRScannerWrapper({ onScan, onError }: Props) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  
  useEffect(() => {
    if (!isStarted) return;
    
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;
    let scanning = false;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15, 
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
             if (scanning && isMounted) {
                scanning = false;
                onScan(decodedText);
             }
          },
          () => {
             // Ignoring parsing errors
          }
        );
        if (isMounted) {
           scanning = true;
        } else {
           html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg("Camera access denied or unavailable. Please use the Copy/Paste buttons instead.");
          if (onError) onError(String(err));
        }
      }
    };

    const timer = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && scanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isStarted, onScan, onError]);

  return (
    <div className="w-full flex flex-col items-center">
      {!isStarted ? (
        <button 
          onClick={() => setIsStarted(true)}
          className="w-full py-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex flex-col items-center justify-center transition-colors"
        >
          <span className="text-3xl mb-2">📸</span>
          <span className="font-medium text-slate-300">Tap to Start Camera Scanner</span>
        </button>
      ) : (
        <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl bg-slate-900 border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20"></div>
      )}
      {errorMsg && <p className="text-rose-400 mt-4 text-sm text-center px-4">{errorMsg}</p>}
    </div>
  );
}
