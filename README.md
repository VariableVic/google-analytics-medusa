# Medusa GA4 Plugin

A Google Analytics 4 plugin for Medusa that automatically tracks ecommerce events on your backend using Measurement Protocol. This plugin implements server-side tracking for key ecommerce events in your Medusa store.

<p align="center">
  <a href="https://twitter.com/intent/follow?screen_name=VariableVic" style="display: inline-block; margin-right: 8px;">
    <img src="https://img.shields.io/twitter/follow/VariableVic.svg?label=Follow%20@VariableVic" alt="Follow @VariableVic" />
  </a>

  <a href="https://victorgerbrands.nl">
    <img src="https://img.shields.io/badge/www-victorgerbrands.nl-blue.svg?style=flat" alt="Website" />
  </a>

  <a href="https://www.linkedin.com/in/victorgerbrands/">
    <img src="https://img.shields.io/badge/linkedin-victorgerbrands-blue.svg?style=flat&logo=linkedin" alt="LinkedIn" />
  </a>
</p>

## Features

The plugin automatically tracks the following GA4 ecommerce events:

- `add_to_cart` - When items are added to a cart
- `remove_from_cart` - When items are removed from a cart
- `add_shipping_info` - When shipping information is added to a cart
- `add_payment_info` - When payment information is added
- `purchase` - When an order is placed

## Prerequisites

- [Medusa backend](https://docs.medusajs.com/development/backend/install)
- Google Analytics 4 property
- GA4 Measurement ID
- GA4 [API Secret](https://support.google.com/analytics/answer/9814495)

## Installation

```bash
yarn add @variablevic/google-analytics-medusa
```

## Configuration

Add the plugin to your `medusa-config.ts`:

```typescript
import { defineConfig } from "@medusajs/utils";

// ... other imports and environment variables

export default defineConfig({
  // ... other configurations
  plugins: [
    // ... other plugins
    {
      resolve: "@variablevic/google-analytics-medusa",
      options: {
        measurementId: "G-XXXXXXXX", // Your GA4 Measurement ID
        apiSecret: "XXXXXXXXXX", // Your GA4 API Secret
        debug: false, // Optional, enables debug mode - no events will be sent to your property when debug is active!
      },
    },
  ],
});
```

### Client-Side Setup

This plugin handles server-side events, but some GA4 ecommerce events need to be implemented on the client side due to their nature:

- `view_item` - Product views
- `begin_checkout` - Checkout initiation
- `sign_up` - User registration
- `login` - User login

Additionally, to properly associate events with users, you need to set the GA client ID as metadata when creating a cart. Here's how to do it in the [Next.js Starter](https://github.com/medusajs/nextjs-starter-medusa):

1. Get the GA client ID from the cookie:

```typescript
export const getGaClientId = async (): Promise<string | null> => {
  const cookies = await nextCookies();
  const gaClientIdCookie = cookies.get("_ga")?.value;

  const gaClientId = (gaClientIdCookie as string)
    .split(".")
    .slice(-2)
    .join(".");

  return gaClientId;
};
```

2. Set the client ID as cart metadata during cart creation:

```typescript
const gaClientId = await getGaClientId();

const body = {
  region_id: region.id,
} as Record<string, any>;

if (gaClientId) {
  body.metadata = {
    ga_client_id: gaClientId,
  };
}

const cartResp = await sdk.store.cart.create(body, {}, headers);
```

## Events Data Format

The plugin automatically formats cart and order data according to GA4's ecommerce event specifications. Each event includes:

- Currency code
- Transaction value
- Item-level details (name, variant, quantity, price)
- Customer information when available

## Development

1. Clone this repository
2. Install dependencies: `yarn install`
3. Build the project: `yarn build`
4. Test the plugin: `yarn test`

For local development and testing:

```bash
npx medusa plugin:develop
```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

MIT
