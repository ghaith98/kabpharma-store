type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<
  string,
  RateLimitEntry
>();

function removeExpiredBuckets(now: number) {
  if (buckets.size < 1_000) return;

  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function takeRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();

  removeExpiredBuckets(now);

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (current.resetAt - now) / 1000
        )
      ),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function getRequestIp(request: Request) {
  return (
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
