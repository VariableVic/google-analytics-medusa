import { logger, SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  PaymentSessionDTO,
  StoreCart,
  StorePaymentCollection,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GOOGLE_ANALYTICS_MODULE } from "../modules/google-analytics";
import { GoogleAnalyticsService } from "../types";
import { formatGACartItems } from "../utils/format-ga-cart-items";

export default async function handlePaymentSessionCreatedEvent({
  event: {
    data: { id, payment_session },
  },
  container,
}: SubscriberArgs<{ id?: string; payment_session?: PaymentSessionDTO }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [paymentCollection],
  } = (await query.graph({
    entity: "payment_collection",
    fields: ["cart.id"],
    filters: { id: payment_session!.payment_collection_id },
    pagination: {
      take: 1,
    },
  })) as { data: [StorePaymentCollection & { cart: StoreCart }] };

  const {
    data: [cart],
  } = (await query.graph({
    entity: "cart",
    fields: ["metadata", "items.*", "items.variant.*"],
    filters: { id: paymentCollection.cart.id },
    pagination: {
      take: 1,
    },
  })) as { data: [StoreCart] };

  const gaClientId = cart.metadata?.ga_client_id as string;
  const customerId = cart.customer_id;
  if (!gaClientId) {
    logger.info(
      `GA4 Plugin: Payment session ${id} does not have a ga_client_id, skipping event`
    );
    return;
  }

  const gaService = container.resolve<GoogleAnalyticsService>(
    GOOGLE_ANALYTICS_MODULE
  );

  const items = cart.items ? formatGACartItems(cart.items, cart) : [];

  await gaService.send({
    client_id: gaClientId,
    user_id: customerId,
    events: [
      {
        name: "add_payment_info",
        params: {
          currency: cart.currency_code.toUpperCase(),
          value: cart.item_total,
          items,
        },
      },
    ],
  });
}

export const config: SubscriberConfig = {
  event: "payment-session.created",
  context: {
    subscriberId: "ga-payment-session-created",
  },
};
