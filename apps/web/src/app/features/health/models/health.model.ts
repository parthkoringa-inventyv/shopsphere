/** `data` payload of the health endpoints: `'ok'` for liveness, `'ready'` for readiness. */
export interface HealthStatus {
  status: string;
}
