export type CartItem = {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  sale_percent?: number;
  image_url: string | null;
  quantity: number;
};

function getCartKey() {
  if (typeof window === "undefined") return "cart_guest";

  const savedUser = localStorage.getItem("kab_user");

  if (!savedUser) return "cart_guest";

  const user = JSON.parse(savedUser);
  return `cart_${user.phone}`;
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const cart = localStorage.getItem(getCartKey());
  return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

export function addToCart(
  item: Omit<CartItem, "quantity">,
  quantity = 1
) {
  const cart = getCart();

  const existingItem = cart.find(
    (cartItem) => cartItem.id === item.id
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      ...item,
      quantity,
    });
  }

  saveCart(cart);
}