/**
 * Server configuration from environment variables only. The server never reads
 * `.env` files in code (.kiro/steering/security-zero-secret.md).
 */
export function readPort(value: string | undefined, fallback = 8787): number {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}
