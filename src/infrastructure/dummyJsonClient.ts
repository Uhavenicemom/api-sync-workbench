import { RESOURCE_DEFINITIONS } from "../domain/resources";
import type {
  FetchResult,
  InvalidSourceRecord,
  ResourceName,
  SourceRecord,
} from "../domain/types";

const API_BASE_URL = "https://dummyjson.com";
const REQUEST_TIMEOUT_MS = 12_000;

export interface FetchResourceOptions {
  delayMs: number;
  failNextRequest: boolean;
  signal?: AbortSignal;
}

export class DemoRequestError extends Error {
  constructor() {
    super("The simulated request failed before reaching DummyJSON.");
    this.name = "DemoRequestError";
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function createRequestSignal(externalSignal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", abortFromExternal, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromExternal);
    },
  };
}

export async function fetchResource(
  resource: ResourceName,
  options: FetchResourceOptions,
): Promise<FetchResult> {
  if (options.failNextRequest) {
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    throw new DemoRequestError();
  }

  const { signal, cleanup } = createRequestSignal(options.signal);
  const url = new URL(`${API_BASE_URL}/${resource}`);
  url.searchParams.set("limit", "0");
  if (options.delayMs > 0) {
    url.searchParams.set("delay", String(options.delayMs));
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) {
      throw new ApiRequestError(
        `DummyJSON returned ${response.status} ${response.statusText}.`,
        response.status,
      );
    }

    const payload: unknown = await response.json();
    if (payload === null || typeof payload !== "object") {
      throw new ApiRequestError("DummyJSON returned an invalid response body.", null);
    }

    const definition = RESOURCE_DEFINITIONS[resource];
    const collection = (payload as Record<string, unknown>)[definition.collectionKey];
    if (!Array.isArray(collection)) {
      throw new ApiRequestError(
        `The response did not include a ${definition.collectionKey} collection.`,
        null,
      );
    }

    const records: SourceRecord[] = [];
    const invalidRecords: InvalidSourceRecord[] = [];
    collection.forEach((value, index) => {
      const parsed = definition.parseRecord(value);
      if (parsed.success) {
        records.push(parsed.data);
      } else {
        invalidRecords.push({ index, reason: parsed.reason });
      }
    });

    const totalValue = (payload as Record<string, unknown>).total;
    return {
      records,
      invalidRecords,
      total: typeof totalValue === "number" ? totalValue : collection.length,
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("The request was cancelled.", null);
    }
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiRequestError("DummyJSON did not respond within 12 seconds.", null);
    }
    throw new ApiRequestError(
      "DummyJSON could not be reached. Check the connection and try again.",
      null,
    );
  } finally {
    cleanup();
  }
}
