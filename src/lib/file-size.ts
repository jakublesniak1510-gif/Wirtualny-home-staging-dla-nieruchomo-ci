/** Rozmiar pliku po polsku: „820 kB”, „3,4 MB” (bez zależności serwerowych – także dla klienta). */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}
