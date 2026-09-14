import productCatalog from "./productCatalog";

export const resolveProductImage = (product, imageOverride) => {
  const image = imageOverride || product?.image || product?.img || product?.galleryImages?.[0] || "";
  if (!image.startsWith("/src/assets/")) return image;

  const catalogProduct = productCatalog.find(
    (item) =>
      item.name.toLowerCase() ===
      String(product.name || product.title).toLowerCase(),
  );
  return catalogProduct?.image || image;
};
