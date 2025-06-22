// Jednoduchý in-memory rate limiter pro Next.js API routes
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const key = identifier;

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // První request nebo vypršel čas
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    // Překročen limit
    return false;
  }

  // Zvýšit počítadlo
  record.count++;
  return true;
}

// Rate limiting pro kontaktní formulář
export function checkContactFormRateLimit(identifier: string): boolean {
  return checkRateLimit(identifier, 5, 15 * 60 * 1000); // 5 requestů za 15 minut
}

// Rate limiting pro API obecně
export function checkApiRateLimit(identifier: string): boolean {
  return checkRateLimit(identifier, 100, 15 * 60 * 1000); // 100 requestů za 15 minut
}

// Získání IP adresy z Next.js requestu
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded && forwarded.length > 0) {
    const parts = forwarded.split(",");
    return parts[0]?.trim() || "localhost";
  }

  if (realIP) {
    return realIP;
  }

  // Fallback pro development
  return "localhost";
}
