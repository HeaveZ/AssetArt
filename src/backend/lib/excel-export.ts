import "server-only";
import ExcelJS from "exceljs";
import type { AssetListRow } from "@/backend/services/assets";

export async function exportAssetsXlsx(rows: AssetListRow[], workspaceName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AssetArt";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Assets");

  ws.columns = [
    { header: "Tag",            key: "tag",            width: 12 },
    { header: "Name",           key: "name",           width: 32 },
    { header: "Brand",          key: "brand",          width: 14 },
    { header: "Model",          key: "model",          width: 22 },
    { header: "Serial",         key: "serial",         width: 22 },
    { header: "Description",    key: "description",    width: 36 },
    { header: "Status",         key: "status",         width: 16 },
    { header: "Category",       key: "category",       width: 16 },
    { header: "Site",           key: "site",           width: 18 },
    { header: "Location",       key: "location",       width: 22 },
    { header: "Assignee",       key: "assignee",       width: 22 },
    { header: "CPU / Chip",     key: "cpu",            width: 16 },
    { header: "Memory (GB)",    key: "memory",         width: 12 },
    { header: "Storage (GB)",   key: "storage",        width: 12 },
    { header: "Display (in)",   key: "display",        width: 12 },
    { header: "OS",             key: "os",             width: 14 },
    { header: "Purchase date",  key: "purchaseDate",   width: 16 },
    { header: "Purchase price", key: "purchasePrice",  width: 16 },
    { header: "Currency",       key: "currency",       width: 10 },
    { header: "Warranty ends",  key: "warrantyEndsAt", width: 16 },
    { header: "Created",        key: "createdAt",      width: 16 },
  ];

  ws.getRow(1).font = { bold: true, size: 11, color: { argb: "FF0B2A4A" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF7F8FA" },
  };
  ws.getRow(1).alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) {
    ws.addRow({
      tag: row.tag,
      name: row.name,
      brand: row.brand,
      model: row.model,
      serial: row.serialNumber,
      description: row.description,
      status: row.status,
      category: row.category?.name ?? "",
      site: row.site?.name ?? "",
      location: row.location?.name ?? "",
      assignee: row.assignee?.name ?? row.assignee?.email ?? "",
      cpu: row.cpu ?? "",
      memory: row.memoryGB ?? "",
      storage: row.storageGB ?? "",
      display: row.displayInches ? Number(row.displayInches) : "",
      os: row.os ?? "",
      purchaseDate: row.purchaseDate,
      purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
      currency: row.currency,
      warrantyEndsAt: row.warrantyEndsAt,
      createdAt: row.createdAt,
    });
  }

  ws.getColumn("purchaseDate").numFmt = "yyyy-mm-dd";
  ws.getColumn("warrantyEndsAt").numFmt = "yyyy-mm-dd";
  ws.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm";
  ws.getColumn("purchasePrice").numFmt = '#,##0.00';

  ws.eachRow((row, n) => {
    if (n === 1) return;
    row.height = 18;
    row.font = { size: 11, color: { argb: "FF0B2A4A" } };
  });

  const meta = workbook.addWorksheet("Meta");
  meta.addRow(["Workspace", workspaceName]);
  meta.addRow(["Exported at", new Date().toISOString()]);
  meta.addRow(["Row count", rows.length]);
  meta.getColumn(1).font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
