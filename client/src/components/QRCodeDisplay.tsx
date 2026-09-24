import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const canCopyImages = typeof window !== "undefined" && "ClipboardItem" in window && !!navigator.clipboard?.write;

export default function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1 }).catch(() => {});
  }, [url]);

  useEffect(() => {
    if (!zoomed || !zoomCanvasRef.current) return;
    QRCode.toCanvas(zoomCanvasRef.current, url, { width: 480, margin: 1 }).catch(() => {});
  }, [zoomed, url]);

  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed]);

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
      <button type="button" className="qr-wrap qr-wrap-button" onClick={() => setZoomed(true)} aria-label="Enlarge QR code">
        <canvas ref={canvasRef} />
      </button>
      {canCopyImages && (
        <button className="subtle" onClick={copyQrImage}>
          {qrCopied ? "QR code copied!" : "Copy QR code as image"}
        </button>
      )}
      <div className="link-box">
        <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button onClick={copyLink}>{copied ? "Copied!" : "Copy"}</button>
      </div>

      {zoomed && (
        <div className="qr-zoom-overlay" onClick={() => setZoomed(false)}>
          <div className="qr-zoom-panel" onClick={(e) => e.stopPropagation()}>
            <canvas ref={zoomCanvasRef} />
            <button className="subtle" onClick={() => setZoomed(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
