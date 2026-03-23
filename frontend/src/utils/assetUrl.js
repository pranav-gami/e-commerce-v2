// Get the base URL for assets based on environment
export const getAssetUrl = (path) => {
    // In production (GitHub Pages), prepend the base path
    // In development, use the path as-is
    const base = import.meta.env.BASE_URL || '/';
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};
