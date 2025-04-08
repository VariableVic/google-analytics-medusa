import { logger } from "@medusajs/framework";
import { GA4Event, GA4EventPayload } from "../../types";
import { PREDEFINED_EVENTS } from "../../utils/predefined-event-params";

type ModuleOptions = {
  apiSecret: string;
  measurementId: string;
  debug?: boolean;
  maxEvents?: number;
};

class GoogleAnalyticsService {
  protected options: ModuleOptions;
  private readonly gaEndpoint: string;
  private readonly debugEndpoint: string;
  private readonly debug: boolean;
  private readonly maxEvents: number;
  static readonly PREDEFINED_EVENTS = PREDEFINED_EVENTS;

  constructor({}, options: ModuleOptions) {
    if (!options.apiSecret || !options.measurementId) {
      throw new Error(
        "GA4 Plugin: Missing required options: apiSecret, measurementId must be provided."
      );
    }

    this.options = options;
    this.debug = options.debug || false;
    this.maxEvents = options.maxEvents || 25;
    this.gaEndpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${this.options.measurementId}&api_secret=${this.options.apiSecret}`;
    this.debugEndpoint = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${this.options.measurementId}&api_secret=${this.options.apiSecret}`;
  }

  async send(payload: GA4EventPayload) {
    this.checkPredefinedEventParams(payload.events);
    this.checkNullParams(payload.events);

    if (payload.events.length > this.maxEvents) {
      await this.sendLargeEventCount(payload);
    } else {
      await this.sendEvents(payload);
    }
  }

  private checkNullParams(events: GA4Event[]) {
    events.forEach((event) => {
      Object.keys(event.params).forEach((param) => {
        if (event.params[param] === null) {
          logger.info(
            `GA4 Plugin: Removed null param for '${param}' in '${event.name}'`
          );
          delete event.params[param];
        }
      });
    });
  }

  private async sendLargeEventCount(payload: GA4EventPayload) {
    while (payload.events.length > 0) {
      const batch = payload.events.splice(0, this.maxEvents);
      await this.sendEvents({ ...payload, events: batch });
    }
  }

  private async sendEvents(payload: GA4EventPayload) {
    const url = this.debug ? this.debugEndpoint : this.gaEndpoint;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `GA4 Plugin: Failed to send events: ${response.statusText}`
        );
      }

      logger.info("GA4 Plugin: Events sent to Google Analytics successfully");
    } catch (error) {
      logger.error(
        "GA4 Plugin: Error sending events to Google Analytics:",
        error
      );
    }
  }

  private checkPredefinedEventParams(events: GA4Event[]): void {
    events.forEach((event) => {
      const requiredParams =
        GoogleAnalyticsService.PREDEFINED_EVENTS[event.name];
      if (requiredParams) {
        requiredParams.forEach((param) => {
          if (this.debug && !(param in event.params)) {
            logger.info(
              `GA4 Plugin: Missing a recommended parameter "${param}" for "${event.name}"`
            );
          }
        });
      }
    });
  }
}

export default GoogleAnalyticsService;
