// External API Configuration
export interface ExternalApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  enableLogging: boolean;
}

export const defaultConfig: ExternalApiConfig = {
  baseUrl:
    process.env.NEXT_PUBLIC_EXTERNAL_API_URL || "http://localhost:8080/api",
  timeout: 10000, // 10 seconds
  retries: 3,
  enableLogging: process.env.NODE_ENV === "development",
};

export const getExternalApiConfig = (): ExternalApiConfig => {
  return {
    baseUrl: process.env.NEXT_PUBLIC_EXTERNAL_API_URL || defaultConfig.baseUrl,
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
    retries: parseInt(process.env.NEXT_PUBLIC_API_RETRIES || "3"),
    enableLogging: process.env.NODE_ENV === "development",
  };
};
