import { useCallback, useMemo, useState } from "react";
import { WishlistContext } from "./wishlistStore";
import productCatalog from "../data/productCatalog";

const getProductId = (product) =>
  String(product.id || product._id || product.productId || "");

const toNumber = (value) =>
  typeof value === "number"
    ? value
    : Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;

const getCatalogProduct = (product) =>
  productCatalog.find(
    (item) =>
      item.name.toLowerCase() ===
      String(product.name || product.title || "").toLowerCase(),
  );

const normalizeWishlistItem = (product) => {
  const catalogProduct = getCatalogProduct(product);
  const id =
    getProductId(product) || `catalog-${catalogProduct?.name || "item"}`;
  return {
    id,
    _id: id,
    name: product.name || product.title || catalogProduct?.name || "Product",
    title: product.title || product.name || catalogProduct?.name || "Product",
    price: toNumber(
      product.priceValue ?? product.price ?? catalogProduct?.price,
    ),
    image:
      product.image ||
      product.img ||
      product.galleryImages?.[0] ||
      catalogProduct?.image ||
      "",
    fallbackImage: catalogProduct?.image || "",
    category: product.category || catalogProduct?.category || "Product",
  };
};

const readWishlist = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("wishlistItems") || "[]");
    return Array.isArray(stored)
      ? stored.filter((item) => item.id).map(normalizeWishlistItem)
      : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(readWishlist);

  const updateItems = useCallback((updater) => {
    setItems((current) => {
      const next = updater(current);
      localStorage.setItem("wishlistItems", JSON.stringify(next));
      window.dispatchEvent(new Event("wishlistUpdated"));
      return next;
    });
  }, []);

  const toggleWishlist = useCallback(
    (product) => {
      const item = normalizeWishlistItem(product);
      if (!item.id) return;
      updateItems((current) =>
        current.some((saved) => String(saved.id) === item.id)
          ? current.filter((saved) => String(saved.id) !== item.id)
          : [...current, item],
      );
    },
    [updateItems],
  );

  const removeFromWishlist = useCallback(
    (id) => {
      updateItems((current) =>
        current.filter((item) => String(item.id) !== String(id)),
      );
    },
    [updateItems],
  );

  const isInWishlist = useCallback(
    (id) => items.some((item) => String(item.id) === String(id)),
    [items],
  );

  const value = useMemo(
    () => ({ items, toggleWishlist, removeFromWishlist, isInWishlist }),
    [items, toggleWishlist, removeFromWishlist, isInWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
