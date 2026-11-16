/** Backend health endpoint paths, relative to the API origin. */
export const HEALTH_API_PATHS = {
  LIVE: '/api/v1/health/live',
  READY: '/api/v1/health/ready',
} as const;
