import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ExternalLink, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  restaurantName: string;
  tableName: string;
  tableNumber: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  url,
  restaurantName,
  tableName,
  tableNumber,
  size = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        fullUrl,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error', error);
          if (canvasRef.current) {
            setDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        },
      );
    }
  }, [fullUrl, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_${restaurantName.replace(/\s+/g, '_')}_Table_${tableNumber}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Scan to Order - Table ${tableNumber}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px solid #0f172a; padding: 30px; border-radius: 16px; max-width: 360px; margin: auto; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            p { color: #64748b; font-size: 14px; margin-top: 0; }
            .tag { background: #0f172a; color: #fff; padding: 6px 14px; border-radius: 999px; font-weight: bold; display: inline-block; margin: 12px 0; }
            img { margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 8px; }
            .hint { font-size: 13px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${restaurantName}</h1>
            <p>Scan with your phone camera to browse menu & order</p>
            <div class="tag">Table ${tableNumber} • ${tableName}</div>
            <div><img src="${dataUrl}" width="220" /></div>
            <p class="hint">No app download needed • Instant digital ordering</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
      <div className="text-center mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">{restaurantName}</h3>
        <span className="text-xs font-mono text-slate-500">
          Table {tableNumber} · {tableName}
        </span>
      </div>

      <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs mb-4">
        <canvas ref={canvasRef} className="rounded-lg max-w-full" />
      </div>

      <div className="w-full text-center mb-4">
        <span className="text-[11px] text-slate-400 break-all font-mono">
          {fullUrl}
        </span>
      </div>

      <div className="flex items-center gap-2 w-full">
        <button
          onClick={handleDownload}
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Save Image
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Flyer
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
