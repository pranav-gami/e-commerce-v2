import { Router } from "express";
import authRoute from "./auth.routes";
import categoryRoute from "./category.routes";
import subcategoryRoute from "./subcategory.routes";
import productRoute from "./product.routes";
import orderRoute from "./order.routes";
import heroRoute from "./hero.routes";
import addressRoute from "./address.routes";
import paymentRoute from "./payment.routes";
import reviewRoute from "./review.routes";
import couponRoute from "./coupon.routes";

const modules = [
  { route: "/", router: authRoute },
  { route: "/categories", router: categoryRoute },
  { route: "/subcategories", router: subcategoryRoute },
  { route: "/products", router: productRoute },
  { route: "/orders", router: orderRoute },
  { route: "/hero", router: heroRoute },
  { route: "/payments", router: paymentRoute },
  { route: "/addresses", router: addressRoute },
  { route: "/reviews", router: reviewRoute },
  { route: "/coupons", router: couponRoute },
];

const router = Router();

modules.forEach((module) => {
  return router.use(module.route, module.router);
});

export default router;
