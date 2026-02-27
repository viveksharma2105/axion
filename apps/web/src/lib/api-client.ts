import type { ApiSuccessResponse, PaginatedResponse } from "@axion/shared";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    let message = `Request failed: ${res.status}`;
    if (body && typeof body === "object" && "error" in body) {
      const err = (body as { error: string | { message?: string } }).error;
      if (typeof err === "string") {
        message = err;
      } else if (err && typeof err === "object" && "message" in err) {
        message = err.message ?? message;
      }
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string) {
    return request<ApiSuccessResponse<T>>(path);
  },

  getPaginated<T>(path: string) {
    return request<PaginatedResponse<T>>(path);
  },

  post<T>(path: string, body?: unknown) {
    return request<ApiSuccessResponse<T>>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown) {
    return request<ApiSuccessResponse<T>>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return request<ApiSuccessResponse<T>>(path, {
      method: "DELETE",
    });
  },
};
