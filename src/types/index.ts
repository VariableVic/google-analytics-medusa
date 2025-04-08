export type GoogleAnalyticsService = {
  send: (payload: GA4EventPayload) => Promise<void>;
};

export type GA4Event = {
  name: string;
  params: Record<string, any>;
};

export type GA4EventPayload = {
  client_id: string;
  user_id?: string | null | undefined;
  events: GA4Event[];
};
