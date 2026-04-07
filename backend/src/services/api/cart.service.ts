import {prisma} from "../../config/prisma";
import ApiError from "../../utils/ApiError";

const getOrCreateCart = async (userId: number) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discount: true,
              image: true,
              stock: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discount: true,
                image: true,
                stock: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  return formatCart(cart);
};

const addItemToCart = async (
  userId: number,
  productId: number,
  quantity: number,
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");
  if (product.status === "INACTIVE")
    throw new ApiError(400, "Product is not available");
  if (product.stock < quantity)
    throw new ApiError(400, `Only ${product.stock} items in stock`);

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (product.stock < newQty)
      throw new ApiError(
        400,
        `Only ${product.stock} items in stock. You already have ${existingItem.quantity} in cart`,
      );

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty, updatedAt: new Date() },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  return getOrCreateCart(userId);
};

const updateCartItem = async (
  userId: number,
  cartItemId: number,
  quantity: number,
) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId: cart.id },
    include: { product: true },
  });
  if (!cartItem) throw new ApiError(404, "Cart item not found");

  if (cartItem.product.stock < quantity)
    throw new ApiError(400, `Only ${cartItem.product.stock} items in stock`);

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity, updatedAt: new Date() },
  });

  return getOrCreateCart(userId);
};

const removeCartItem = async (userId: number, cartItemId: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId: cart.id },
  });
  if (!cartItem) throw new ApiError(404, "Cart item not found");

  await prisma.cartItem.delete({ where: { id: cartItemId } });

  return getOrCreateCart(userId);
};

const clearCart = async (userId: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return getOrCreateCart(userId);
};

const formatCart = (cart: any) => {
  const items = cart.items.map((item: any) => {
    const discountedPrice =
      item.product.price -
      (item.product.price * (item.product.discount || 0)) / 100;
    return {
      id: item.id,
      quantity: item.quantity,
      product: item.product,
      unitPrice: parseFloat(item.product.price.toFixed(2)),
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      subtotal: parseFloat((discountedPrice * item.quantity).toFixed(2)),
    };
  });

  const totalItems = items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0,
  );
  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + item.subtotal,
    0,
  );

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    totalItems,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

export default {
  getOrCreateCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
