import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const canCopyImages = typeof window !== "undefined" && "ClipboardItem" in window && !!navigator.clipboard?.write;

export default function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1 }).catch(() => {});
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — the link is still selectable/visible in the input
    }
  }

  async function copyQrImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 1500);
    } catch {
      // clipboard image write unsupported/denied — the QR code is still visible to save manually
    }
  }

  return (
    <div className="stack">
      <div className="qr-wrap">
        <canvas ref={canvasRef} />
      </div>
      {canCopyImages && (
        <button className="subtle" onClick={copyQrImage}>
          {qrCopied ? "QR code copied!" : "Copy QR code as image"}
        </button>
      )}
      <div className="link-box">
        <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button onClick={copyLink}>{copied ? "Copied!" : "Copy"}</button>
      </div>
    </div>
  );
}
