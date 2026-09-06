import { AI_CONFIG_STORAGE_KEY, type AIRequestConfig } from "./providers/ai";

function readClientAIConfig(): AIRequestConfig {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(AI_CONFIG_STORAGE_KEY) || "{}") as AIRequestConfig;
  } catch {
    return {};
  }
}

export function withAIConfig(init: RequestInit = {}) {
  const config = readClientAIConfig();
  if (!config || !Object.values(config).some(Boolean)) return init;

  const headers = new Headers(init.headers || {});
  headers.set("x-reading-archive-ai-config", encodeURIComponent(JSON.stringify(config)));
  return { ...init, headers };
}

export async function aiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, withAIConfig(init));
}
