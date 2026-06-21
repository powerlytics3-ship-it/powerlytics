export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function isProductionDataMode(): boolean {
  return process.env.POWERLYTIC_DATA_MODE === "prisma";
}

export const configTodos = {
  // TODO: add real Postgres/Timescale URL in DATABASE_URL.
  databaseUrl: "DATABASE_URL",
  // TODO: add real Redis URL in REDIS_URL for BullMQ queues.
  redisUrl: "REDIS_URL",
  // TODO: add real MQTT broker URL in MQTT_URL if devices use MQTT.
  mqttUrl: "MQTT_URL",
  // TODO: add real OIDC issuer URL from Keycloak/Auth0/Cognito/etc.
  oidcIssuerUrl: "OIDC_ISSUER_URL",
  // TODO: add API audience/client ID expected inside access tokens.
  oidcAudience: "OIDC_AUDIENCE",
  // TODO: add a KMS/secret-manager value used when hashing device API keys.
  deviceApiKeyPepper: "DEVICE_API_KEY_PEPPER",
  // TODO: add bridge URL if config/command delivery is HTTP instead of MQTT.
  configBridgeUrl: "CONFIG_BRIDGE_URL"
} as const;
