import {
  logger,
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { StoreCart, StoreCartLineItem } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GOOGLE_ANALYTICS_MODULE } from "../modules/google-analytics";
import { GoogleAnalyticsService } from "../types";
import { formatGACartItems } from "../utils/format-ga-cart-items";

export default async function handleCartUpdated({
  event: {
    data: { id, changes },
  },
  container,
}: SubscriberArgs<{
  id?: string;
  changes?: {
    [key: string]: {
      action: "added" | "updated" | "deleted";
      value: Record<string, any>;
    };
  };
}>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [cart],
  } = (await query.graph({
    entity: "cart",
    fields: ["*"],
    filters: {
      id,
    },
    pagination: {
      take: 1,
    },
  })) as {
    data: [StoreCart];
  };

  const gaClientId = cart.metadata?.ga_client_id as string;
  const customerId = cart.customer_id;
  const identifiers = {
    client_id: gaClientId,
    user_id: customerId,
  };

  if (!gaClientId) {
    logger.info(
      `GA4 Plugin: No GA client ID found for cart ${id}. Make sure to set metadata.ga_client_id on cart creation in your client.`
    );
    return;
  }

  const ga = container.resolve<GoogleAnalyticsService>(GOOGLE_ANALYTICS_MODULE);

  if (changes?.line_items) {
    const items = changes.line_items.value as StoreCartLineItem[];

    const itemValue = items.reduce(
      (acc, item) =>
        acc + (item.unit_price as number) * (item.quantity as number),
      0
    );

    switch (changes.line_items.action) {
      case "added":
        await ga.send({
          ...identifiers,
          events: [
            {
              name: "add_to_cart",
              params: {
                currency: cart.currency_code.toUpperCase(),
                value: itemValue,
                items: formatGACartItems(items, cart),
              },
            },
          ],
        });
        break;
      case "deleted":
        await ga.send({
          ...identifiers,
          events: [
            {
              name: "remove_from_cart",
              params: {
                currency: cart.currency_code.toUpperCase(),
                value: itemValue,
                items: formatGACartItems(items, cart),
              },
            },
          ],
        });
        break;
      default:
        logger.info(
          `GA4 Plugin: Unknown action: ${changes.line_items.action}, skipping event`
        );
        break;
    }
  } else if (changes?.shipping_address) {
    await ga.send({
      ...identifiers,
      events: [
        {
          name: "add_shipping_info",
          params: {
            currency: cart.currency_code.toUpperCase(),
            value: cart.item_total,
            items: formatGACartItems(cart.items!, cart),
          },
        },
      ],
    });
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
  context: {
    subscriberId: "ga-cart-updates",
  },
};
