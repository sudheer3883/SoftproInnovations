export const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://softproinnovations.onrender.com";

export const getImageUrl = (image) => {
	if (!image || typeof image !== "string") return "";
	if (/^(data:|blob:|https?:\/\/)/i.test(image)) return image;
	if (image.startsWith("/assets/") || image.startsWith("/favicon")) return image;
	return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};
