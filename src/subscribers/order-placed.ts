import {
  logger,
  SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { StoreOrder } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GOOGLE_ANALYTICS_MODULE } from "../modules/google-analytics";
import { GoogleAnalyticsService } from "../types";
import { formatGACartItems } from "../utils/format-ga-cart-items";

export default async function handleOrderPlacedEvent({
  event: {
    data: { id },
  },
  container,
}: SubscriberArgs<{
  id?: string;
}>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [order],
  } = (await query.graph({
    entity: "order",
    fields: ["*", "items.*", "sales_channel_id"],
    filters: { id },
  })) as { data: StoreOrder[] };

  if (!order) {
    return;
  }

  const gaClientId = order.metadata?.ga_client_id as string;
  const customerId = order.customer_id;

  if (!gaClientId) {
    logger.info(
      `GA4 Plugin: Order ${id} does not have a ga_client_id, skipping event`
    );
    return;
  }
  const gaService = container.resolve<GoogleAnalyticsService>(
    GOOGLE_ANALYTICS_MODULE
  );

  await gaService
    .send({
      client_id: gaClientId,
      user_id: customerId,
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: order.id,
            value: order.total,
            affiliation: order.sales_channel_id,
            tax: order.tax_total,
            shipping: order.shipping_total,
            currency: order.currency_code,
            items: formatGACartItems(order.items!, order),
          },
        },
      ],
    })
    .catch((err) => {
      logger.error("Error sending purchase event", err);
    });
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
  context: {
    subscriberId: "ga-purchase",
  },
};
