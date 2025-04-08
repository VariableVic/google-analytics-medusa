import { GA4Event, GA4EventPayload } from "../../types";
import { PREDEFINED_EVENTS } from "../../utils/predefined-event-params";

type ModuleOptions = {
  apiSecret: string;
  measurementId: string;
  debug?: boolean;
};

class GoogleAnalyticsService {
  protected options: ModuleOptions;
  private readonly GA_ENDPOINT: string;
  private readonly DEBUG_ENDPOINT: string;
  private readonly DEBUG: boolean;
  static readonly PREDEFINED_EVENTS = PREDEFINED_EVENTS;

  constructor({}, options: ModuleOptions) {
    if (!options.apiSecret || !options.measurementId) {
      throw new Error(
        "GA4 Plugin: Missing required options: apiSecret, measurementId must be provided."
      );
    }

    this.options = options;
    this.DEBUG = options.debug || false;
    this.GA_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${this.options.measurementId}&api_secret=${this.options.apiSecret}`;
    this.DEBUG_ENDPOINT = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${this.options.measurementId}&api_secret=${this.options.apiSecret}`;
  }

  async send(payload: GA4EventPayload) {
    const MAX_EVENTS = 25;

    this.checkPredefinedEventParams(payload.events);
    this.nullParamCheck(payload.events);

    if (payload.events.length > MAX_EVENTS) {
      await this.sendLargeEventCount(payload);
    } else {
      await this._sendEvents(payload);
    }
  }

  private nullParamCheck(events: GA4Event[]) {
    events.forEach((event) => {
      Object.keys(event.params).forEach((param) => {
        if (event.params[param] === null) {
          console.log(`Removed null param for '${param}' in '${event.name}'`);
          delete event.params[param];
        }
      });
    });
  }

  private async sendLargeEventCount(payload: GA4EventPayload) {
    const MAX_EVENTS = 25;
    while (payload.events.length > 0) {
      const batch = payload.events.splice(0, MAX_EVENTS);
      await this._sendEvents({ ...payload, events: batch });
    }
  }

  async _sendEvents(payload: GA4EventPayload) {
    const url = this.DEBUG ? this.DEBUG_ENDPOINT : this.GA_ENDPOINT;

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

      console.log("GA4 Plugin: Events sent to Google Analytics successfully");
    } catch (error) {
      console.error(
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
          if (this.DEBUG && !(param in event.params)) {
            console.log(
              `GA4 Plugin: Missing a recommended parameter "${param}" for "${event.name}"`
            );
          }
        });
      }
    });
  }
}

export default GoogleAnalyticsService;
