// License analytics event logging
import { prisma } from '@/db/prisma';

// Event types for analytics
export const EventTypes = {
  // Trial events
  TRIAL_STARTED: 'trial.started',
  TRIAL_EXPIRED: 'trial.expired',
  TRIAL_CONVERTED: 'trial.converted',

  // License events
  LICENSE_ACTIVATED: 'license.activated',
  LICENSE_VALIDATED: 'license.validated',
  LICENSE_DEACTIVATED: 'license.deactivated',
  LICENSE_REVOKED: 'license.revoked',
  LICENSE_RECOVERED: 'license.recovered',

  // Purchase events
  PURCHASE_STRIPE: 'purchase.stripe',
  PURCHASE_APPLE: 'purchase.apple',
  PURCHASE_MICROSOFT: 'purchase.microsoft',
  REFUND_PROCESSED: 'refund.processed',

  // Error events
  ACTIVATION_FAILED: 'activation.failed',
  VALIDATION_FAILED: 'validation.failed',
  IAP_VERIFICATION_FAILED: 'iap.verification_failed',

  // Update events
  UPDATE_CHECK: 'update.check',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export type EventResult = 'success' | 'failure' | 'error';

export interface LogEventParams {
  eventType: EventType;
  result: EventResult;
  licenseId?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
  ipAddress?: string;
  country?: string;
  errorCode?: string;
  details?: Record<string, unknown>;
}

/**
 * Log an analytics event to the database.
 * This is fire-and-forget - errors are logged but don't throw.
 */
export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: params.eventType,
        result: params.result,
        licenseId: params.licenseId,
        deviceId: params.deviceId,
        platform: params.platform,
        appVersion: params.appVersion,
        ipAddress: params.ipAddress,
        country: params.country,
        errorCode: params.errorCode,
        details: params.details,
      },
    });
  } catch (error) {
    // Log but don't throw - analytics shouldn't break the main flow
    console.error('Failed to log analytics event:', error);
  }
}

/**
 * Log a trial started event.
 */
export async function logTrialStarted(params: {
  deviceId: string;
  platform?: string;
  appVersion?: string;
  ipAddress?: string;
}): Promise<void> {
  await logEvent({
    eventType: EventTypes.TRIAL_STARTED,
    result: 'success',
    ...params,
  });
}

/**
 * Log a trial already used error.
 */
export async function logTrialAlreadyUsed(params: {
  deviceId: string;
  platform?: string;
  ipAddress?: string;
}): Promise<void> {
  await logEvent({
    eventType: EventTypes.TRIAL_STARTED,
    result: 'failure',
    errorCode: 'TRIAL_ALREADY_USED',
    ...params,
  });
}
