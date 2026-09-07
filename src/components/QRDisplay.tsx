import { useEffect, useState } from 'react';
import { generateQRDataUrl } from '../qr/generate';

export function QRDisplay({ data }: { data: string }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (data) {
      generateQRDataUrl(data).then(setUrl).catch(console.error);
    }
  }, [data]);

  if (!url) return <div className="animate-pulse w-64 h-64 bg-slate-800 rounded-xl mx-auto flex items-center justify-center">Generating QR...</div>;

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        <img src={url} alt="QR Code" className="w-64 h-64 object-contain" />
      </div>
      <button 
        onClick={() => navigator.clipboard.writeText(data)}
        className="mt-4 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
      >
        <span>📋</span> Copy Raw Data (Fallback)
      </button>
    </div>
  );
}
