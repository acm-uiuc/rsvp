import { config } from "../config";

export function getBaseUrl() {
    return config.apiBaseUrl;
}

export function getTurnstileKey() {
    return config.turnstileSiteKey;
}