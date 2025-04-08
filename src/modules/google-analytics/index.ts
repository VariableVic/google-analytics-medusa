import { Module } from "@medusajs/framework/utils";
import GoogleAnalyticsService from "./service";

export const GOOGLE_ANALYTICS_MODULE = "google-analytics";

export default Module(GOOGLE_ANALYTICS_MODULE, {
  service: GoogleAnalyticsService,
});
