"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, FileUp, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { bulkImportCsvAction, type CsvImportSummary } from "@/backend/actions/assets";
import { CSV_TEMPLATE_HEADERS } from "@/shared/schemas/asset";
import { cn } from "@/frontend/lib/utils";

export function AssetCsvImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();

  function chooseFile(picked: File | null | undefined) {
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".csv")) {
      toast.error("Pick a .csv file");
      return;
    }
    setFile(picked);
    setSummary(null);
  }

  function downloadTemplate() {
    const headerLine = CSV_TEMPLATE_HEADERS.join(",");
    const exampleLine = [
      "", // tag → leave blank for auto
      "Apple MacBook Pro 16",
      "Apple",
      "MacBook Pro 16 M3",
      "C02ABC123XYZ",
      "Mac",
      "HQ Istanbul",
      "Floor 12 — Engineering",
      "elif@evam.com",
      "AVAILABLE",
      "2024-08-01",
      "3199",
      "USD",
      "32",
      "1024",
      "macOS 14",
      "M3 Pro",
      "16.2",
      "2027-08-01",
      "Refurbished battery",
    ].join(",");
    const blob = new Blob([`${headerLine}\n${exampleLine}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assetnova-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function submit() {
    if (!file) {
      toast.info("Pick a CSV first");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const result = await bulkImportCsvAction(fd);
      if (!result.ok) {
        toast.error("Import failed", { description: result.error });
        return;
      }
      setSummary(result.data);
      const { imported, failed, total } = result.data;
      if (failed === 0) {
        toast.success(`Imported ${imported} of ${total} assets`);
        router.refresh();
      } else {
        toast.warning(`Imported ${imported} of ${total} — ${failed} row${failed === 1 ? "" : "s"} skipped`, {
          description: "See the breakdown below for details.",
        });
      }
    });
  }

  function reset() {
    setFile(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-text text-[15px] font-medium tracking-tight">CSV import</h2>
            <p className="text-text-muted max-w-md text-[12.5px] leading-relaxed">
              Upload a CSV with one asset per row. We&apos;ll look up sites, locations,
              categories, and assignees by name (or email) and skip rows we can&apos;t parse.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>
            <Download />
            Template
          </Button>
        </header>

        <div
          className={cn(
            "mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-center",
            "transition-colors duration-150",
            dragOver
              ? "border-brand-orange-500 bg-brand-orange-500/5"
              : file
                ? "border-success-fg/40 bg-success-bg/30"
                : "border-border bg-surface-muted/30",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            chooseFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => chooseFile(e.target.files?.[0])}
          />
          <span className="bg-surface mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border">
            {file ? (
              <CheckCircle2 className="text-success-fg h-5 w-5" />
            ) : (
              <FileUp className="text-text-subtle h-5 w-5" />
            )}
          </span>
          <p className="text-text text-[13px] font-medium">
            {file ? file.name : "Drop a CSV here, or click to pick"}
          </p>
          <p className="text-text-muted mt-1 text-[11.5px]">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "Max 5 MB · UTF-8"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {file ? "Pick another" : "Choose file"}
            </Button>
            {file ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="primary" size="md" disabled={!file || pending} onClick={submit}>
            {pending ? <Loader2 className="animate-spin" /> : <FileUp />}
            Import {file ? `(${file.name})` : ""}
          </Button>
        </div>
      </div>

      {summary ? <ImportSummary summary={summary} /> : null}
    </div>
  );
}

function ImportSummary({ summary }: { summary: CsvImportSummary }) {
  return (
    <section className="bg-surface rounded-xl border p-5">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-text text-[13.5px] font-medium tracking-tight">Result</h3>
          <p className="text-text-muted text-[11.5px]">
            {summary.imported} created · {summary.failed} skipped · {summary.total} rows scanned
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="success" size="md">
            <CheckCircle2 className="h-3 w-3" /> {summary.imported}
          </Badge>
          {summary.failed > 0 ? (
            <Badge tone="danger" size="md">
              <XCircle className="h-3 w-3" /> {summary.failed}
            </Badge>
          ) : null}
        </div>
      </header>

      {summary.errors.length > 0 ? (
        <ul className="border-border-subtle mt-4 max-h-60 divide-y overflow-y-auto rounded-lg border">
          {summary.errors.map((e) => (
            <li key={`${e.row}-${e.reason}`} className="flex items-start gap-3 px-3 py-2.5">
              <XCircle className="text-danger-fg mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-text text-[12.5px] font-medium">
                  Row {e.row}
                  {e.tag ? <span className="asset-tag ml-2 font-mono">{e.tag}</span> : null}
                </p>
                <p className="text-text-muted text-[11.5px]">{e.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
