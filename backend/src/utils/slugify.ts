export const slugify = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special chars
    .replace(/[\s_-]+/g, "-") // spaces → hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
