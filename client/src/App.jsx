import Home from "./pages/user/Home";
import { Routes, Route, BrowserRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import About from "./pages/user/About";
import Contact from "./pages/user/Contact";
import Product from "./pages/user/Product";
import ProductDetails from "./pages/user/ProductDetails";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import Profile from "./pages/user/Profile";
import UserOrders from "./pages/user/Orders";
import Addresses from "./pages/user/Addresses";
import Reviews from "./pages/user/Reviews";
import Wishlist from "./pages/user/Wishlist";
import ChangePassword from "./pages/user/ChangePassword";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import OrderSuccess from "./pages/user/OrderSuccess";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import DashboardLayout from "./pages/admin/DashboardLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import Categories from "./pages/admin/Categories";
import AddCategory from "./pages/admin/AddCategory";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import Orders from "./pages/admin/Orders";
import UsersList from "./pages/admin/UsersList";
import Inventory from "./pages/admin/Inventory";
import Complaints from "./pages/admin/Complaints";

import AdminLogin from "./pages/admin/AdminLogin";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
};

export const App = () => {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/about" element={<About />}></Route>
            <Route path="/contact" element={<Contact />}></Route>
            <Route path="/Product" element={<Product />}></Route>
            <Route path="/product/:id" element={<ProductDetails />}></Route>
            <Route path="/cart" element={<Cart />}></Route>
            <Route path="/checkout" element={<Checkout />}></Route>
            <Route
              path="/order-success/:orderId"
              element={<OrderSuccess />}
            ></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/register" element={<Register />}></Route>
            <Route path="/profile" element={<Profile />}></Route>
            <Route path="/profile/orders" element={<UserOrders />}></Route>
            <Route path="/profile/addresses" element={<Addresses />}></Route>
            <Route path="/profile/reviews" element={<Reviews />}></Route>
            <Route path="/profile/wishlist" element={<Wishlist />}></Route>
            <Route
              path="/profile/change-password"
              element={<ChangePassword />}
            ></Route>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="categories" element={<Categories />} />
              <Route path="categories/add" element={<AddCategory />} />
              <Route path="add-category" element={<AddCategory />} />
              <Route path="categories/edit/:id" element={<AddCategory />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<AddProduct />} />
              <Route path="orders" element={<Orders />} />
              <Route path="users" element={<UsersList />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="complaints" element={<Complaints />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
};
export default App;
