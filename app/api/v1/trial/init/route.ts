// POST /api/v1/trial/init - Initialize a trial for a new device
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/db/prisma';
import {
  errorResponse,
  successResponse,
  getHttpStatusForError,
} from '@/lib/errors';
import { signResponse } from '@/lib/signing';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logTrialStarted, logTrialAlreadyUsed } from '@/lib/license-analytics';

// Request body schema
const trialInitSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  app_version: z.string().optional(),
  platform: z.enum(['windows', 'macos', 'ios']).optional(),
});

// Trial duration in days
const TRIAL_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request.headers);

    // Check rate limit (5 trial inits per hour per IP)
    const rateLimitResult = await checkRateLimit('trialInit', clientIp);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse('RATE_LIMITED', 'Too many trial requests. Please try again later.', {
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

    // Parse and validate request body
    const body = await request.json();
    const parseResult = trialInitSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        errorResponse('INVALID_REQUEST', 'Invalid request body', {
          errors: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    const { device_id, app_version, platform } = parseResult.data;

    // Check if a trial already exists for this device
    const existingTrial = await prisma.trial.findUnique({
      where: { deviceId: device_id },
    });

    if (existingTrial) {
      // Log the failed attempt
      await logTrialAlreadyUsed({
        deviceId: device_id,
        platform,
        ipAddress: clientIp,
      });

      return NextResponse.json(
        errorResponse(
          'TRIAL_ALREADY_USED',
          'A trial has already been started on this device'
        ),
        { status: getHttpStatusForError('TRIAL_ALREADY_USED') }
      );
    }

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Create the trial record
    await prisma.trial.create({
      data: {
        deviceId: device_id,
        startedAt: now,
        expiresAt,
        ipAddress: clientIp,
        appVersion: app_version,
        platform,
      },
    });

    // Log the successful trial start
    await logTrialStarted({
      deviceId: device_id,
      platform,
      appVersion: app_version,
      ipAddress: clientIp,
    });

    // Prepare response data
    const responseData = {
      expires_at: expiresAt.toISOString(),
      days_remaining: TRIAL_DAYS,
    };

    // Sign the response
    const signature = await signResponse(responseData);

    return NextResponse.json(successResponse(responseData, signature), {
      status: 200,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Trial init error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
