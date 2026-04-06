import { Router } from "express";
import authRoute from "./auth.routes";
import categoryRoute from "./category.routes";
import subcategoryRoute from "./subcategory.routes";
import cartRoute from "./cart.routes";
import orderRoute from "./order.routes";
import productRoute from "./product.routes";
import paymentRoute from "./payment.routes";
import locationRoute from "./location.routes";
import heroRoute from "./hero.routes";
import addressRoute from "./address.routes";
import reviewRoute from "./review.routes";
import couponRoute from "./coupon.routes";

const modules = [
  { route: "/auth", router: authRoute },
  { route: "/categories", router: categoryRoute },
  { route: "/subcategories", router: subcategoryRoute },
  { route: "/cart", router: cartRoute },
  { route: "/orders", router: orderRoute },
  { route: "/products", router: productRoute },
  { route: "/payment", router: paymentRoute },
  { route: "/location", router: locationRoute },
  { route: "/hero", router: heroRoute },
  { route: "/addresses", router: addressRoute },
  { route: "/reviews", router: reviewRoute },
  { route: "/coupons", router: couponRoute },
];

const router = Router();

modules.forEach((module) => {
  return router.use(module.route, module.router);
});

export default router;
