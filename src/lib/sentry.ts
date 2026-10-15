import * as Sentry from "@sentry/node";
import { config } from "../config.js";

let initialized = false;

export function initSentry(): void {
  if (initialized || !config.sentryDsn) return;
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampleRate: 1.0,
    environment: config.nodeEnv,
  });
  initialized = true;
}

export async function tracePricingRun<T>(
  title: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!initialized) {
    return fn();
  }
  return Sentry.startSpan(
    {
      name: "pricing.run",
      op: "agent.pipeline",
      attributes: { "pricewire.title_length": title.length },
    },
    async () => fn(),
  );
}
