type RouteMetrics = {
  count: number;
  totalDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
};

type MetricsSnapshot = {
  uptimeSeconds: number;
  startedAt: string;
  totalRequests: number;
  statusCounts: Record<string, number>;
  routes: Record<string, RouteMetrics & { averageDurationMs: number }>;
};

const startedAt = new Date();
let totalRequests = 0;
const statusCounts: Record<string, number> = {};
const routeMetrics = new Map<string, RouteMetrics>();

const getStatusGroup = (statusCode: number) => {
  return `${Math.floor(statusCode / 100)}xx`;
};

const getRouteKey = (method: string, path: string) => {
  return `${method.toUpperCase()} ${path}`;
};

export const recordHttpRequestMetric = ({
  method,
  path,
  statusCode,
  durationMs,
}: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}) => {
  totalRequests += 1;

  const statusGroup = getStatusGroup(statusCode);
  statusCounts[statusGroup] = (statusCounts[statusGroup] ?? 0) + 1;

  const routeKey = getRouteKey(method, path);
  const current = routeMetrics.get(routeKey);

  if (!current) {
    routeMetrics.set(routeKey, {
      count: 1,
      totalDurationMs: durationMs,
      minDurationMs: durationMs,
      maxDurationMs: durationMs,
    });
    return;
  }

  current.count += 1;
  current.totalDurationMs += durationMs;
  current.minDurationMs = Math.min(current.minDurationMs, durationMs);
  current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
};

export const getMetricsSnapshot = (): MetricsSnapshot => {
  const routes: MetricsSnapshot["routes"] = {};

  for (const [route, metric] of routeMetrics.entries()) {
    routes[route] = {
      ...metric,
      averageDurationMs: Number(
        (metric.totalDurationMs / metric.count).toFixed(2),
      ),
      totalDurationMs: Number(metric.totalDurationMs.toFixed(2)),
      minDurationMs: Number(metric.minDurationMs.toFixed(2)),
      maxDurationMs: Number(metric.maxDurationMs.toFixed(2)),
    };
  }

  return {
    uptimeSeconds: Number((process.uptime()).toFixed(2)),
    startedAt: startedAt.toISOString(),
    totalRequests,
    statusCounts,
    routes,
  };
};
