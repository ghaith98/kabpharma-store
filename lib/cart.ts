export type CartItem = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const cart = localStorage.getItem("cart");
  return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const cart = getCart();

  const existingItem = cart.find((cartItem) => cartItem.id === item.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...item,
      quantity: 1,
    });
  }

  saveCart(cart);
}   