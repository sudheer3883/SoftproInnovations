export const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getImageUrl = (image) => {
	if (!image || typeof image !== "string") return "";
	if (/^(data:|blob:|https?:\/\/)/i.test(image)) return image;
	if (
		image.startsWith("/assets/") ||
		image.startsWith("/src/assets/") ||
		image.startsWith("/favicon")
	) return image;
	return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

export const getProductImageUrl = (product, image) => {
	const source = image || product?.img || product?.image || product?.galleryImages?.[0];
	if (/^(data:|blob:|https?:\/\/)/i.test(source || "")) {
		return source;
	}
	return getImageUrl(source);
};
