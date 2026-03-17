export type CkanResponse<T> = {
  help: string;
  success: boolean;
  result: T;
};

export type OpendataPackageShowResult = {
  id: string;
  name: string;
  title: string;
  title_translated?: Record<string, string>;
  notes?: string;
  notes_translated?: Record<string, string>;
  author?: string;
  author_email?: string;
  license_title?: string;
  license_url?: string;
  metadata_created?: string;
  metadata_modified?: string;
  url?: string;
  organization?: {
    id: string;
    name: string;
    title: string;
    description?: string;
    image_url?: string;
    created?: string;
    state?: string;
  };
  groups?: Array<{
    id: string;
    name: string;
    title: string;
    image_display_url?: string;
  }>;
  resources: Array<{
    id: string;
    name: string;
    name_translated?: Record<string, string>;
    format?: string;
    created?: string;
    last_modified?: string;
    metadata_modified?: string;
    mimetype?: string;
    size?: number;
    url: string;
    url_type?: string;
  }>;
};

export const DEFAULT_DATASET_ID =
  "neqliyyat-sektorunda-sernisin-dovriyyesi-milyon-sernisin-km";

export const DATASET_IDS = {
  passengerTurnover:
    "neqliyyat-sektorunda-sernisin-dovriyyesi-milyon-sernisin-km",
  passengerTurnoverAlt: "sernisin-dovriyyesi-milyon-sernisin-km",
  passengerTurnoverYoYPercent:
    "neqliyyat-sektorunda-sernisin-dovriyyesi-evvelki-ile-nisbeten-le",
  transportIncome:
    "neqliyyat-sektorunda-dasinmalardan-elde-olunan-gelir-min-manat",
  transportExpenditures:
    "neqliyyat-sektorunda-yuk-ve-sernisin-dasinmasina-cekilmis-xercler-min-manat",
  passengerTransportRevenue: "revenue-from-passenger-transportation",
} as const;

export function opendataPackageShowUrl(id: string) {
  const u = new URL("https://admin.opendata.az/api/3/action/package_show");
  u.searchParams.set("id", id);
  return u.toString();
}

