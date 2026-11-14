import { apiClient } from "@/shared/lib";
export interface RecordItem {
  id: string;
  [key: string]: unknown;
}
export interface PageData {
  items: RecordItem[];
  total: number;
  totalPages: number;
  page: number;
}
export const request = async <T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> => {
  const result = await apiClient<{ data: T }>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return result.data;
};
export function value(
  row: RecordItem | Record<string, unknown>,
  key: string,
): string {
  const result = key
    .split(".")
    .reduce<unknown>(
      (obj, part) =>
        obj && typeof obj === "object"
          ? (obj as Record<string, unknown>)[part]
          : undefined,
      row,
    );
  if (typeof result === "string" && /^\d{4}-\d{2}-\d{2}T/.test(result))
    return new Date(result).toLocaleDateString("en-PK", {
      timeZone: "Asia/Karachi",
    });
  return result === null || result === undefined ? "—" : String(result);
}
export async function download(path: string, filename: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}${path}`,
    { credentials: "include", signal: AbortSignal.timeout(20000) },
  );
  if (!response.ok) throw new Error("Download failed. Please try again.");
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
