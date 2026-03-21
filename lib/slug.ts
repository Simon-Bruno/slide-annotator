export function generateSlug(filename: string, timestamp: number): string {
  const prefix = filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `${prefix}-${timestamp}`;
}
