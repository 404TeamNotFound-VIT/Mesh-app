import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useState } from 'react';

interface Props {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export function QRScannerWrapper({ onScan, onError }: Props) {
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
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
             // Ignoring parsing errors (happens on every frame that doesn't have a QR code)
          }
        );
        if (isMounted) {
           scanning = true;
        } else {
           // We unmounted while starting
           html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg("Camera access denied or unavailable. Please use the Copy/Paste buttons instead.");
          if (onError) onError(String(err));
        }
      }
    };

    // Small delay to ensure the DOM element is fully mounted and ready
    const timer = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && scanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full flex flex-col items-center">
      <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl bg-slate-900 border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20"></div>
      {errorMsg && <p className="text-rose-400 mt-4 text-sm text-center px-4">{errorMsg}</p>}
    </div>
  );
}
