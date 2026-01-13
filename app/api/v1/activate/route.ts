// POST /api/v1/activate - Activate a license key on a device
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/db/prisma';
import {
  errorResponse,
  successResponse,
  getHttpStatusForError,
} from '@/lib/errors';
import { signResponse } from '@/lib/signing';
import { checkRateLimit, getClientIp, maybeCleanup } from '@/lib/rate-limit';
import { isValidLicenseKeyFormat, normalizeLicenseKey } from '@/lib/license-keys';
import { logEvent, EventTypes } from '@/lib/license-analytics';

// Request body schema
const activateSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  device_id: z.string().min(1, 'Device ID is required'),
  device_name: z.string().optional(),
  platform: z.enum(['windows', 'macos', 'ios']).optional(),
  app_version: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = activateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        errorResponse('INVALID_REQUEST', 'Invalid request body', {
          errors: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    const { license_key, device_id, device_name, platform, app_version } = parseResult.data;

    // Validate license key format
    if (!isValidLicenseKeyFormat(license_key)) {
      await logEvent({
        eventType: EventTypes.ACTIVATION_FAILED,
        result: 'failure',
        deviceId: device_id,
        platform,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'INVALID_LICENSE_KEY',
      });

      return NextResponse.json(
        errorResponse('INVALID_LICENSE_KEY', 'Invalid license key format'),
        { status: getHttpStatusForError('INVALID_LICENSE_KEY') }
      );
    }

    const normalizedKey = normalizeLicenseKey(license_key);

    // Check rate limit (10 activations per hour per license key)
    const rateLimitResult = await checkRateLimit('activate', normalizedKey);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse('RATE_LIMITED', 'Too many activation attempts. Please try again later.', {
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Find the license
    const license = await prisma.license.findUnique({
      where: { licenseKey: normalizedKey },
      include: {
        devices: {
          where: { isActive: true },
        },
      },
    });

    if (!license) {
      await logEvent({
        eventType: EventTypes.ACTIVATION_FAILED,
        result: 'failure',
        deviceId: device_id,
        platform,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'LICENSE_NOT_FOUND',
      });

      return NextResponse.json(
        errorResponse('LICENSE_NOT_FOUND', 'License key not found'),
        { status: getHttpStatusForError('LICENSE_NOT_FOUND') }
      );
    }

    // Check if license is revoked
    if (license.isRevoked) {
      await logEvent({
        eventType: EventTypes.ACTIVATION_FAILED,
        result: 'failure',
        licenseId: license.id,
        deviceId: device_id,
        platform,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'LICENSE_REVOKED',
      });

      return NextResponse.json(
        errorResponse('LICENSE_REVOKED', 'This license has been revoked'),
        { status: getHttpStatusForError('LICENSE_REVOKED') }
      );
    }

    // Check if license was refunded
    if (license.isRefunded) {
      await logEvent({
        eventType: EventTypes.ACTIVATION_FAILED,
        result: 'failure',
        licenseId: license.id,
        deviceId: device_id,
        platform,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'LICENSE_REFUNDED',
      });

      return NextResponse.json(
        errorResponse('LICENSE_REFUNDED', 'This license has been refunded'),
        { status: getHttpStatusForError('LICENSE_REFUNDED') }
      );
    }

    // Check if device is already activated
    const existingDevice = license.devices.find((d) => d.deviceId === device_id);
    if (existingDevice) {
      // Device already activated - just update last validated time
      await prisma.deviceActivation.update({
        where: { id: existingDevice.id },
        data: {
          lastValidated: new Date(),
          appVersion: app_version,
          deviceName: device_name || existingDevice.deviceName,
        },
      });

      const responseData = {
        license_key: license.licenseKey,
        licensed_version: license.purchasedMajorVersion ?? 1,
        devices_used: license.devices.length,
        devices_max: license.maxDevices,
      };

      const signature = await signResponse(responseData);
      maybeCleanup();

      return NextResponse.json(successResponse(responseData, signature), {
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      });
    }

    // Check device limit
    if (license.devices.length >= license.maxDevices) {
      await logEvent({
        eventType: EventTypes.ACTIVATION_FAILED,
        result: 'failure',
        licenseId: license.id,
        deviceId: device_id,
        platform,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'DEVICE_LIMIT_REACHED',
        details: {
          devices_used: license.devices.length,
          devices_max: license.maxDevices,
        },
      });

      return NextResponse.json(
        errorResponse(
          'DEVICE_LIMIT_REACHED',
          `Maximum device limit (${license.maxDevices}) reached. Deactivate a device first.`,
          {
            devices_used: license.devices.length,
            devices_max: license.maxDevices,
          }
        ),
        { status: getHttpStatusForError('DEVICE_LIMIT_REACHED') }
      );
    }

    // Activate the device
    await prisma.deviceActivation.create({
      data: {
        licenseId: license.id,
        deviceId: device_id,
        deviceName: device_name,
        platform,
        appVersion: app_version,
        firstActivated: new Date(),
        lastValidated: new Date(),
        isActive: true,
      },
    });

    // Check if this was a trial conversion
    const trial = await prisma.trial.findUnique({
      where: { deviceId: device_id },
    });

    if (trial && !trial.convertedToLicenseId) {
      await prisma.trial.update({
        where: { id: trial.id },
        data: { convertedToLicenseId: license.id },
      });

      await logEvent({
        eventType: EventTypes.TRIAL_CONVERTED,
        result: 'success',
        licenseId: license.id,
        deviceId: device_id,
        platform,
        ipAddress: clientIp,
      });
    }

    // Log successful activation
    await logEvent({
      eventType: EventTypes.LICENSE_ACTIVATED,
      result: 'success',
      licenseId: license.id,
      deviceId: device_id,
      platform,
      appVersion: app_version,
      ipAddress: clientIp,
    });

    // Prepare response
    const responseData = {
      license_key: license.licenseKey,
      licensed_version: license.purchasedMajorVersion ?? 1,
      devices_used: license.devices.length + 1,
      devices_max: license.maxDevices,
    };

    const signature = await signResponse(responseData);
    maybeCleanup();

    return NextResponse.json(successResponse(responseData, signature), {
      status: 200,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Activate error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
