import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import cartService from "../../services/api/cart.service";
import ApiError from "../../utils/ApiError";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

const getCart = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  const data = await cartService.getOrCreateCart(req.user.id);
  return sendResponse(res, 200, "Cart fetched successfully", data);
});

const addItem = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  const { productId, quantity } = req.body;
  const data = await cartService.addItemToCart(req.user.id, productId, quantity);
  return sendResponse(res, 200, "Item added to cart successfully", data);
});

const updateItem = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  const cartItemId = Number(req.params.itemId);
  const { quantity } = req.body;
  const data = await cartService.updateCartItem(req.user.id, cartItemId, quantity);
  return sendResponse(res, 200, "Cart item updated successfully", data);
});

const removeItem = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  const cartItemId = Number(req.params.itemId);
  const data = await cartService.removeCartItem(req.user.id, cartItemId);
  return sendResponse(res, 200, "Item removed from cart successfully", data);
});

const clearCart = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  const data = await cartService.clearCart(req.user.id);
  return sendResponse(res, 200, "Cart cleared successfully", data);
});

export default {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
