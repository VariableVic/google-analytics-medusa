import {
  StoreCart,
  StoreCartLineItem,
  StoreOrder,
  StoreOrderLineItem,
} from "@medusajs/framework/types";

type Item = StoreCartLineItem | StoreOrderLineItem;

export const formatGACartItems = (
  items: Item[],
  cartOrOrder: StoreCart | StoreOrder
) => {
  return items?.map((item, index) => ({
    item_id: item.variant_id,
    item_name: item.product_title,
    affiliation: cartOrOrder.sales_channel_id,
    discount: item.discount_total,
    index,
    item_category: item.variant?.product?.categories
      ?.map((category) => category.name)
      .join(","),
    item_variant: item.variant_title,
    location_id: cartOrOrder.sales_channel_id,
    price: item.unit_price,
    quantity: item.quantity,
  }));
};
