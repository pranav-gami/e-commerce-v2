import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./redux/store";
import { fetchProfile, selectUser } from "./redux/slices/authSlice";
import { fetchCart } from "./redux/slices/cartSlice";
import { loadWishlist } from "./redux/slices/wishlistSlice";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ContactPage from "./pages/ContactPage";
import ThankYouPage from "./pages/ThankYouPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProductDetailPage from "./pages/Productdetailpage";
import CheckoutAddressPage from "./pages/CheckoutAddressPage";
import CheckoutPaymentPage from "./pages/CheckoutPaymentPage";
import "./styles/global.css";

// ── App initializer — runs once on mount ─────────────────────────────────────
const AppInit = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadWishlist(user));
  }, [dispatch, user]);

  return children;
};

// ── Routes ────────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <div className="app">
    <ScrollToTop />
    <Header />
    <main className="main-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/checkout/address" element={<CheckoutAddressPage />} />
        <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppInit>
          <AppRoutes />
        </AppInit>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
