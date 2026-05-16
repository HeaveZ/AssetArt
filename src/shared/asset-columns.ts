/**
 * Canonical column identifiers for the Asset table.
 *
 * Shared between the server (validation of stored column preferences) and
 * the client (column registry + reorder UI). Adding/removing a column means
 * updating this list; nothing outside this file should hard-code a column id
 * for security-sensitive comparisons.
 */
export const ASSET_COLUMN_IDS = [
  "select",
  "tag",
  "name",
  "brand",
  "model",
  "serialNumber",
  "assignee",
  "category",
  "site",
  "purchaseDate",
  "status",
  "cpu",
  "memory",
  "storage",
  "displayInches",
  "os",
  "description",
  "value",
  "warranty",
  "created",
  "action",
] as const;

export type AssetColumnId = (typeof ASSET_COLUMN_IDS)[number];

/** Columns shown by default when a user hasn't saved a layout yet. */
export const DEFAULT_VISIBLE_COLUMNS: AssetColumnId[] = [
  "select",
  "tag",
  "name",
  "brand",
  "model",
  "serialNumber",
  "assignee",
  "purchaseDate",
  "status",
  "category",
  "cpu",
  "memory",
  "storage",
  "os",
  "action",
];

/** Columns the user cannot hide (UX guarantee + keeps the selector consistent). */
export const PINNED_COLUMNS: ReadonlyArray<AssetColumnId> = ["select", "action"];

/** Human-readable label per column, used in the picker UI. */
export const ASSET_COLUMN_LABELS: Record<AssetColumnId, string> = {
  select: "Select",
  tag: "Asset Tag ID",
  name: "Asset name",
  brand: "Brand",
  model: "Model",
  serialNumber: "Serial number",
  assignee: "Assigned to",
  category: "Category",
  site: "Site",
  purchaseDate: "Purchase date",
  status: "Status",
  cpu: "Chip / CPU",
  memory: "Memory",
  storage: "Storage",
  displayInches: "Display",
  os: "Operating system",
  description: "Description",
  value: "Purchase value",
  warranty: "Warranty ends",
  created: "Created",
  action: "Action",
};
