// POST /api/v1/validate - Validate an activated license
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
const validateSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  device_id: z.string().min(1, 'Device ID is required'),
  app_version: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = validateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        errorResponse('INVALID_REQUEST', 'Invalid request body', {
          errors: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    const { license_key, device_id, app_version } = parseResult.data;

    // Validate license key format
    if (!isValidLicenseKeyFormat(license_key)) {
      await logEvent({
        eventType: EventTypes.VALIDATION_FAILED,
        result: 'failure',
        deviceId: device_id,
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

    // Check rate limit (60 validations per hour per device)
    const rateLimitResult = await checkRateLimit('validate', device_id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse('RATE_LIMITED', 'Too many validation requests. Please try again later.', {
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
        eventType: EventTypes.VALIDATION_FAILED,
        result: 'failure',
        deviceId: device_id,
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
        eventType: EventTypes.VALIDATION_FAILED,
        result: 'failure',
        licenseId: license.id,
        deviceId: device_id,
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
        eventType: EventTypes.VALIDATION_FAILED,
        result: 'failure',
        licenseId: license.id,
        deviceId: device_id,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'LICENSE_REFUNDED',
      });

      return NextResponse.json(
        errorResponse('LICENSE_REFUNDED', 'This license has been refunded'),
        { status: getHttpStatusForError('LICENSE_REFUNDED') }
      );
    }

    // Check if device is activated for this license
    const deviceActivation = license.devices.find((d) => d.deviceId === device_id);
    if (!deviceActivation) {
      await logEvent({
        eventType: EventTypes.VALIDATION_FAILED,
        result: 'failure',
        licenseId: license.id,
        deviceId: device_id,
        appVersion: app_version,
        ipAddress: clientIp,
        errorCode: 'DEVICE_NOT_ACTIVATED',
      });

      return NextResponse.json(
        errorResponse('DEVICE_NOT_ACTIVATED', 'This device is not activated for this license'),
        { status: getHttpStatusForError('DEVICE_NOT_ACTIVATED') }
      );
    }

    // Update last validated time
    await prisma.deviceActivation.update({
      where: { id: deviceActivation.id },
      data: {
        lastValidated: new Date(),
        appVersion: app_version || deviceActivation.appVersion,
      },
    });

    // Log successful validation
    await logEvent({
      eventType: EventTypes.LICENSE_VALIDATED,
      result: 'success',
      licenseId: license.id,
      deviceId: device_id,
      appVersion: app_version,
      ipAddress: clientIp,
    });

    // Determine license status based on major version
    // Parse app major version (e.g., "1.2.3" -> 1)
    const appMajorVersion = app_version ? parseInt(app_version.split('.')[0], 10) : null;
    const licensedVersion = license.purchasedMajorVersion;

    // Check if app version is covered by the license
    const versionCovered = appMajorVersion !== null && appMajorVersion <= licensedVersion;
    const status = versionCovered ? 'licensed' : 'licensed_upgrade_required';

    // Prepare response
    const responseData = {
      valid: true,
      status,
      licensed_version: licensedVersion,
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
  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
