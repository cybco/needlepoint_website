'use server';

import { prisma } from '@/db/prisma';
import { generateLicenseKey } from '@/lib/license-keys';
import { logEvent, EventTypes } from '@/lib/license-analytics';
import { SOFTWARE_MAJOR_VERSION } from '@/lib/constants';

const PAGE_SIZE = 20;

export interface LicenseWithDeviceCounts {
  id: string;
  licenseKey: string;
  email: string;
  customerName: string | null;
  purchaseDate: Date;
  updatesExpire: Date;
  isRevoked: boolean;
  source: string;
  totalInstalls: number;
  windowsInstalls: number;
  macosInstalls: number;
  iosInstalls: number;
  lastInstalled: Date | null;
}

export async function getAllLicenses({
  page = 1,
  query,
}: {
  page?: number;
  query?: string;
}) {
  try {
    const whereClause = query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' as const } },
            { licenseKey: { contains: query, mode: 'insensitive' as const } },
            { customerName: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get licenses with their device activations
    const licenses = await prisma.license.findMany({
      where: whereClause,
      include: {
        devices: {
          where: { isActive: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    // Transform to include device counts by platform
    const licensesWithCounts: LicenseWithDeviceCounts[] = licenses.map((license) => {
      const devices = license.devices;

      const windowsInstalls = devices.filter((d) => d.platform === 'windows').length;
      const macosInstalls = devices.filter((d) => d.platform === 'macos').length;
      const iosInstalls = devices.filter((d) => d.platform === 'ios').length;

      const lastInstalled = devices.length > 0
        ? devices.reduce((latest, d) =>
            d.lastValidated > latest ? d.lastValidated : latest,
            devices[0].lastValidated
          )
        : null;

      return {
        id: license.id,
        licenseKey: license.licenseKey,
        email: license.email,
        customerName: license.customerName,
        purchaseDate: license.purchaseDate,
        updatesExpire: license.updatesExpire,
        isRevoked: license.isRevoked,
        source: license.source,
        totalInstalls: devices.length,
        windowsInstalls,
        macosInstalls,
        iosInstalls,
        lastInstalled,
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.license.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
      success: true,
      data: licensesWithCounts,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return {
      success: false,
      message: 'Failed to fetch licenses',
      data: null,
    };
  }
}

export async function getLicenseStats() {
  try {
    const [totalLicenses, activeLicenses, totalDevices, recentActivations] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({ where: { isRevoked: false } }),
      prisma.deviceActivation.count({ where: { isActive: true } }),
      prisma.deviceActivation.count({
        where: {
          isActive: true,
          firstActivated: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Get device counts by platform
    const devicesByPlatform = await prisma.deviceActivation.groupBy({
      by: ['platform'],
      where: { isActive: true },
      _count: { platform: true },
    });

    const platformCounts = {
      windows: 0,
      macos: 0,
      ios: 0,
    };

    devicesByPlatform.forEach((item) => {
      if (item.platform && item.platform in platformCounts) {
        platformCounts[item.platform as keyof typeof platformCounts] = item._count.platform;
      }
    });

    return {
      success: true,
      data: {
        totalLicenses,
        activeLicenses,
        revokedLicenses: totalLicenses - activeLicenses,
        totalDevices,
        recentActivations,
        ...platformCounts,
      },
    };
  } catch (error) {
    console.error('Error fetching license stats:', error);
    return {
      success: false,
      message: 'Failed to fetch license stats',
      data: null,
    };
  }
}

// Purchase parameters
interface PurchaseLicenseParams {
  email: string;
  userId: string;
  amount: number;
  paymentMethod: 'stripe' | 'mock';
  customerName?: string;
}

/**
 * Purchase a new license (mock payment for now).
 * In production, this would be called after Stripe webhook confirms payment.
 */
export async function purchaseLicense(params: PurchaseLicenseParams) {
  try {
    const { email, userId, amount, paymentMethod, customerName } = params;

    // Mock payment processing
    // In production, this would verify Stripe payment intent or webhook
    if (paymentMethod === 'mock') {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Generate unique license key
    let licenseKey = generateLicenseKey();

    // Ensure key is unique (very unlikely collision, but be safe)
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.license.findUnique({
        where: { licenseKey },
      });
      if (!existing) break;
      licenseKey = generateLicenseKey();
      attempts++;
    }

    // Calculate updates expiration (1 year from now)
    const now = new Date();
    const updatesExpire = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Create the license
    const license = await prisma.license.create({
      data: {
        licenseKey,
        email,
        customerName: customerName || null,
        userId,
        purchaseDate: now,
        purchasedMajorVersion: SOFTWARE_MAJOR_VERSION,
        updatesExpire, // Kept for backwards compatibility
        maxDevices: 3,
        licenseType: 'PERPETUAL',
        source: paymentMethod === 'mock' ? 'MANUAL' : 'STRIPE',
        paymentId: paymentMethod === 'mock' ? `mock_${Date.now()}` : null,
      },
    });

    // Log the purchase event
    await logEvent({
      eventType: paymentMethod === 'mock' ? EventTypes.PURCHASE_STRIPE : EventTypes.PURCHASE_STRIPE,
      result: 'success',
      licenseId: license.id,
      details: {
        amount,
        email,
        paymentMethod,
      },
    });

    return {
      success: true,
      licenseKey: license.licenseKey,
      licenseId: license.id,
      message: 'License created successfully',
    };
  } catch (error) {
    console.error('Error creating license:', error);
    return {
      success: false,
      message: 'Failed to create license',
      licenseKey: null,
    };
  }
}

/**
 * Create a manual license (admin function).
 */
export async function createManualLicense(params: {
  email: string;
  customerName?: string;
  notes?: string;
}) {
  try {
    const { email, customerName, notes } = params;

    // Generate unique license key
    let licenseKey = generateLicenseKey();

    // Ensure key is unique
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.license.findUnique({
        where: { licenseKey },
      });
      if (!existing) break;
      licenseKey = generateLicenseKey();
      attempts++;
    }

    // Calculate updates expiration (1 year from now)
    const now = new Date();
    const updatesExpire = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Create the license
    const license = await prisma.license.create({
      data: {
        licenseKey,
        email,
        customerName: customerName || null,
        purchaseDate: now,
        purchasedMajorVersion: SOFTWARE_MAJOR_VERSION,
        updatesExpire, // Kept for backwards compatibility
        maxDevices: 3,
        licenseType: 'PERPETUAL',
        source: 'MANUAL',
        notes,
      },
    });

    return {
      success: true,
      licenseKey: license.licenseKey,
      licenseId: license.id,
      message: 'License created successfully',
    };
  } catch (error) {
    console.error('Error creating manual license:', error);
    return {
      success: false,
      message: 'Failed to create license',
    };
  }
}
