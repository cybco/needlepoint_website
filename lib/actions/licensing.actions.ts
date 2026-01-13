'use server';

import { prisma } from '@/db/prisma';

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
