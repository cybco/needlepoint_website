/**
 * URL Validation Service
 * Provides comprehensive URL validation including security checks and status code verification
 */

export interface UrlValidationResult {
  isValid: boolean;
  message?: string;
  statusCode?: number;
}

/**
 * Validates URL security (blocks malicious URLs)
 * Blocks: localhost, private IPs, file:// protocols
 */
export function validateUrlSecurity(url: string): { isValid: boolean; message?: string } {
  try {
    const parsed = new URL(url);
    
    // Block file protocol
    if (parsed.protocol === 'file:') {
      return { isValid: false, message: "File protocol URLs are not allowed" };
    }

    // Block localhost and 127.0.0.1
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return { isValid: false, message: "Localhost URLs are not allowed" };
    }

    // Block private IP ranges
    const hostname = parsed.hostname;
    
    // 10.0.0.0/8
    if (hostname.match(/^10\./)) {
      return { isValid: false, message: "Private IP addresses are not allowed" };
    }

    // 192.168.0.0/16
    if (hostname.match(/^192\.168\./)) {
      return { isValid: false, message: "Private IP addresses are not allowed" };
    }

    // 172.16.0.0/12
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return { isValid: false, message: "Private IP addresses are not allowed" };
    }

    // Block other reserved ranges
    if (hostname.match(/^169\.254\./) || // Link-local
        hostname.match(/^224\./) ||      // Multicast
        hostname.match(/^255\.255\.255\.255$/)) { // Broadcast
      return { isValid: false, message: "Reserved IP addresses are not allowed" };
    }

    return { isValid: true };
    
  } catch {
    return { isValid: false, message: "Invalid URL format" };
  }
}

/**
 * Checks URL accessibility by making a HEAD request
 * Returns status code and validation result
 */
export async function validateUrlAccessibility(url: string, timeoutMs: number = 5000): Promise<UrlValidationResult> {
  try {
    // First check security
    const securityCheck = validateUrlSecurity(url);
    if (!securityCheck.isValid) {
      return securityCheck;
    }

    // Skip accessibility check if running in Edge Runtime or server context
    if (typeof window === 'undefined' && (globalThis as { EdgeRuntime?: boolean }).EdgeRuntime) {
      return {
        isValid: true,
        message: "URL format is valid (accessibility check skipped in Edge Runtime)"
      };
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'PinkCloverUSA-LinkChecker/1.0'
      },
      // Prevent redirects to potentially malicious sites
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    // Handle redirects manually to check each destination
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        // Validate redirect destination
        const redirectCheck = validateUrlSecurity(location);
        if (!redirectCheck.isValid) {
          return {
            isValid: false,
            message: `Redirect destination blocked: ${redirectCheck.message}`,
            statusCode: response.status
          };
        }
      }
    }

    // Accept 2xx and 3xx status codes
    if (response.status >= 200 && response.status < 400) {
      return {
        isValid: true,
        statusCode: response.status
      };
    }

    // Handle specific error codes
    let message: string;
    switch (response.status) {
      case 401:
        message = "URL requires authentication";
        break;
      case 403:
        message = "URL access is forbidden";
        break;
      case 404:
        message = "URL not found";
        break;
      case 500:
        message = "Server error at URL";
        break;
      case 503:
        message = "URL is temporarily unavailable";
        break;
      default:
        message = `URL returned status ${response.status}`;
    }

    return {
      isValid: false,
      message,
      statusCode: response.status
    };

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          isValid: false,
          message: "URL request timed out"
        };
      }
      
      if (error.message.includes('fetch')) {
        return {
          isValid: false,
          message: "Unable to connect to URL"
        };
      }
    }

    return {
      isValid: false,
      message: "Network error while checking URL"
    };
  }
}

/**
 * Comprehensive URL validation combining format, security, and accessibility checks
 * This is the main validation function used by server actions
 */
export async function validateUrl(url: string): Promise<UrlValidationResult> {
  // Basic format validation
  try {
    new URL(url);
  } catch {
    return {
      isValid: false,
      message: "Invalid URL format"
    };
  }

  // Length check (max 2048 chars from requirements)
  if (url.length > 2048) {
    return {
      isValid: false,
      message: "URL exceeds maximum length of 2048 characters"
    };
  }

  // Security validation
  const securityCheck = validateUrlSecurity(url);
  if (!securityCheck.isValid) {
    return securityCheck;
  }

  // Accessibility check (with 5 second timeout)
  return await validateUrlAccessibility(url, 5000);
}

/**
 * Quick validation for form fields (without network request)
 * Used for real-time validation in UI
 */
export function validateUrlFormat(url: string): { isValid: boolean; message?: string } {
  if (!url.trim()) {
    return { isValid: false, message: "URL is required" };
  }

  if (url.length > 2048) {
    return { isValid: false, message: "URL too long (max 2048 characters)" };
  }

  try {
    new URL(url);
  } catch {
    return { isValid: false, message: "Invalid URL format" };
  }

  return validateUrlSecurity(url);
}

/**
 * Batch URL validation for multiple URLs
 * Used when importing lists or bulk operations
 */
export async function validateUrls(urls: string[]): Promise<Map<string, UrlValidationResult>> {
  const results = new Map<string, UrlValidationResult>();
  
  // Process URLs in batches to avoid overwhelming target servers
  const batchSize = 5;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (url) => {
      const result = await validateUrl(url);
      return [url, result] as [string, UrlValidationResult];
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(([url, result]) => {
      results.set(url, result);
    });

    // Small delay between batches to be respectful to target servers
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Extract domain from URL for analytics and duplicate detection
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if URL is likely to be a temporary or suspicious domain
 * Used for additional security screening
 */
export function checkSuspiciousDomain(url: string): { isSuspicious: boolean; reason?: string } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check for suspicious TLDs (extend as needed)
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
    if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
      return { isSuspicious: true, reason: "Potentially temporary domain" };
    }

    // Check for excessive subdomains (potential homograph attacks)
    const parts = hostname.split('.');
    if (parts.length > 5) {
      return { isSuspicious: true, reason: "Suspicious subdomain structure" };
    }

    // Check for suspicious patterns
    if (hostname.includes('--') || hostname.match(/\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}/)) {
      return { isSuspicious: true, reason: "Suspicious domain pattern" };
    }

    return { isSuspicious: false };
  } catch {
    return { isSuspicious: true, reason: "Invalid domain format" };
  }
}