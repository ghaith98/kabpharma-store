export type CartItem = {
  id: number;
  name: string;
  product_name?: string;

  price: number;
  original_price?: number;
  sale_percent?: number;

  image_url: string | null;
  quantity: number;

  variant_id?: number | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;

  cart_key?: string;
};

function getCartKey() {
  if (typeof window === "undefined") {
    return "cart_guest";
  }

  const savedUser =
    localStorage.getItem(
      "kab_user"
    );

  if (!savedUser) {
    return "cart_guest";
  }

  try {
    const user =
      JSON.parse(savedUser);

    return `cart_${user.phone}`;
  } catch {
    return "cart_guest";
  }
}

function getItemKey(
  item: Pick<
    CartItem,
    "id" | "variant_id"
  >
) {
  return `${Number(item.id)}-${
    item.variant_id != null
      ? Number(item.variant_id)
      : "base"
  }`;
}

export function getCart(): CartItem[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const cart =
      localStorage.getItem(
        getCartKey()
      );

    const parsedCart =
      cart
        ? JSON.parse(cart)
        : [];

    return Array.isArray(
      parsedCart
    )
      ? parsedCart
      : [];
  } catch {
    return [];
  }
}

export function saveCart(
  cart: CartItem[]
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    getCartKey(),
    JSON.stringify(cart)
  );
}

export function addToCart(
  item: Omit<
    CartItem,
    "quantity"
  >,
  quantity = 1
) {
  const safeQuantity =
    Math.max(
      1,
      Math.floor(
        Number(quantity) || 1
      )
    );

  const cart = getCart();

  const itemKey =
    getItemKey(item);

  const existingItem =
    cart.find(
      (cartItem) =>
        getItemKey(cartItem) ===
        itemKey
    );

  if (existingItem) {
    existingItem.quantity +=
      safeQuantity;

    existingItem.name =
      item.name;

    existingItem.product_name =
      item.product_name;

    existingItem.price =
      item.price;

    existingItem.original_price =
      item.original_price;

    existingItem.sale_percent =
      item.sale_percent;

    existingItem.image_url =
      item.image_url;

    existingItem.variant_id =
      item.variant_id ?? null;

    existingItem.variant_label_ar =
      item.variant_label_ar ??
      null;

    existingItem.variant_label_en =
      item.variant_label_en ??
      null;

    existingItem.cart_key =
      itemKey;
  } else {
    cart.push({
      ...item,

      variant_id:
        item.variant_id ?? null,

      variant_label_ar:
        item.variant_label_ar ??
        null,

      variant_label_en:
        item.variant_label_en ??
        null,

      cart_key:
        itemKey,

      quantity:
        safeQuantity,
    });
  }

  saveCart(cart);
}

export function getCartItemQuantity(
  id: number,
  variant_id?:
    | number
    | null
) {
  const itemKey =
    getItemKey({
      id,

      variant_id:
        variant_id ?? null,
    });

  const item =
    getCart().find(
      (cartItem) =>
        getItemKey(cartItem) ===
        itemKey
    );

  return Math.max(
    0,
    Number(
      item?.quantity || 0
    )
  );
}

export function updateCartQuantity(
  id: number,
  variant_id:
    | number
    | null,
  quantity: number
) {
  const itemKey =
    getItemKey({
      id,

      variant_id:
        variant_id ?? null,
    });

  const safeQuantity =
    Math.max(
      0,
      Math.floor(
        Number(quantity) || 0
      )
    );

  const cart = getCart();

  const updatedCart =
    safeQuantity === 0
      ? cart.filter(
          (item) =>
            getItemKey(item) !==
            itemKey
        )
      : cart.map((item) =>
          getItemKey(item) ===
          itemKey
            ? {
                ...item,

                quantity:
                  safeQuantity,

                cart_key:
                  itemKey,
              }
            : item
        );

  saveCart(updatedCart);
}

export function clearCart() {
  saveCart([]);
}

export function removeFromCart(
  id: number,
  variant_id?:
    | number
    | null
) {
  const itemKey =
    getItemKey({
      id,

      variant_id:
        variant_id ?? null,
    });

  const updatedCart =
    getCart().filter(
      (item) =>
        getItemKey(item) !==
        itemKey
    );

  saveCart(updatedCart);
}