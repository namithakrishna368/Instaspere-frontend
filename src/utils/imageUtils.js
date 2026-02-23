const DEFAULT_AVATAR = "https://www.seekpng.com/png/detail/966-9665493_my-profile-icon-blank-profile-image-circle.png";

/**
 * Returns a proper image URL. Handles:
 * - Cloudinary URLs (already http)
 * - Local paths (prefixes with backend URL)
 * - Empty/null/undefined (returns fallback or null)
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${base}/${path.replace(/\\/g, "/")}`;
};

/**
 * Returns a proper avatar URL with a default fallback.
 */
export const getAvatarUrl = (avatar) => {
    if (!avatar) return DEFAULT_AVATAR;
    return getImageUrl(avatar) || DEFAULT_AVATAR;
};
