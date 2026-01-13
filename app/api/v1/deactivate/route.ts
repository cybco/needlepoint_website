// POST /api/v1/deactivate - Deactivate a device from a license
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/db/prisma';
import {
  errorResponse,
  successResponse,
  getHttpStatusForError,
} from '@/lib/errors';
import { checkRateLimit, getClientIp, maybeCleanup } from '@/lib/rate-limit';
import { isValidLicenseKeyFormat, normalizeLicenseKey } from '@/lib/license-keys';
import { logEvent, EventTypes } from '@/lib/license-analytics';

// Request body schema
const deactivateSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  device_id: z.string().min(1, 'Device ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = deactivateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        errorResponse('INVALID_REQUEST', 'Invalid request body', {
          errors: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    const { license_key, device_id } = parseResult.data;

    // Validate license key format
    if (!isValidLicenseKeyFormat(license_key)) {
      return NextResponse.json(
        errorResponse('INVALID_LICENSE_KEY', 'Invalid license key format'),
        { status: getHttpStatusForError('INVALID_LICENSE_KEY') }
      );
    }

    const normalizedKey = normalizeLicenseKey(license_key);

    // Check rate limit (use activate rate limit - 10 per hour)
    const rateLimitResult = await checkRateLimit('activate', `deactivate:${normalizedKey}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse('RATE_LIMITED', 'Too many deactivation attempts. Please try again later.', {
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
      return NextResponse.json(
        errorResponse('LICENSE_NOT_FOUND', 'License key not found'),
        { status: getHttpStatusForError('LICENSE_NOT_FOUND') }
      );
    }

    // Find the device activation
    const deviceActivation = license.devices.find((d) => d.deviceId === device_id);
    if (!deviceActivation) {
      return NextResponse.json(
        errorResponse('DEVICE_NOT_FOUND', 'Device not found or already deactivated'),
        { status: getHttpStatusForError('DEVICE_NOT_FOUND') }
      );
    }

    // Deactivate the device
    await prisma.deviceActivation.update({
      where: { id: deviceActivation.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    // Log deactivation
    await logEvent({
      eventType: EventTypes.LICENSE_DEACTIVATED,
      result: 'success',
      licenseId: license.id,
      deviceId: device_id,
      platform: deviceActivation.platform || undefined,
      ipAddress: clientIp,
    });

    // Prepare response
    const responseData = {
      devices_used: license.devices.length - 1,
      devices_max: license.maxDevices,
    };

    maybeCleanup();

    return NextResponse.json(successResponse(responseData), {
      status: 200,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Deactivate error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
