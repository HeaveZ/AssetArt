"use client";

import { useEffect, useState } from "react";
import { Download, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";

interface Props {
  asset: {
    id: string;
    tag: string;
    name: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
  };
  baseUrl?: string;
}

export function AssetQrSticker({ asset, baseUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const origin =
      baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
    const target = `${origin}/assets/${asset.id}`;
    QRCode.toDataURL(target, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [open, asset.id, baseUrl]);

  function handlePrint() {
    if (!dataUrl) return;
    const w = window.open("", "_blank", "width=420,height=520");
    if (!w) return;
    w.document.write(printHtml(asset, dataUrl));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 220);
  }

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${asset.tag}.png`;
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <QrCode />
        QR sticker
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR sticker</DialogTitle>
          <DialogDescription>
            Scanning opens the asset detail in the browser.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-surface-muted/40 flex flex-col items-center gap-3 rounded-xl border p-4">
          <div className="bg-white shadow-soft flex aspect-square w-44 items-center justify-center rounded-lg">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL preview, not user-supplied
              <img src={dataUrl} alt="QR code" className="h-40 w-40" />
            ) : (
              <span className="text-text-subtle text-[11px]">Generating…</span>
            )}
          </div>
          <div className="text-center">
            <span className="asset-tag text-[10.5px]">{asset.tag}</span>
            <p className="text-text mt-1 text-[12.5px] font-medium leading-tight">
              {asset.name}
            </p>
            {asset.brand || asset.model ? (
              <p className="text-text-muted text-[11px]">
                {[asset.brand, asset.model].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {asset.serialNumber ? (
              <p className="text-text-subtle font-mono text-[10.5px]">
                S/N {asset.serialNumber}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!dataUrl}>
            <Download />
            PNG
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!dataUrl}>
            <Printer />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function printHtml(asset: Props["asset"], dataUrl: string): string {
  const escape = (s: string) =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>QR · ${escape(asset.tag)}</title>
  <style>
    @page { size: 80mm 50mm; margin: 4mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto; color: #0f172a; }
    .sticker { display: flex; gap: 10px; padding: 6px; align-items: center; }
    .qr { width: 38mm; height: 38mm; }
    .meta { flex: 1; min-width: 0; }
    .tag {
      display: inline-block; padding: 2px 6px; border-radius: 4px;
      background: #fff7ed; color: #9a3412; font-weight: 700; font-size: 11px; letter-spacing: 0.04em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .name { font-size: 12px; font-weight: 600; margin: 4px 0 2px; line-height: 1.2; word-break: break-word; }
    .sub  { font-size: 10px; color: #475569; line-height: 1.3; }
    .sn   { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="sticker">
    <img class="qr" src="${dataUrl}" alt="QR" />
    <div class="meta">
      <span class="tag">${escape(asset.tag)}</span>
      <div class="name">${escape(asset.name)}</div>
      ${asset.brand || asset.model ? `<div class="sub">${escape([asset.brand, asset.model].filter(Boolean).join(" · "))}</div>` : ""}
      ${asset.serialNumber ? `<div class="sn">S/N ${escape(asset.serialNumber)}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
}
