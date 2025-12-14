import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorCode: string | undefined;
    
    try {
      // Clone the response so we can read it without consuming the original
      const text = await res.clone().text();
      if (text) {
        try {
          const json = JSON.parse(text);
          // Extract error message from JSON response
          if (json.error) {
            errorMessage = json.error;
          } else if (json.message) {
            errorMessage = json.message;
          } else {
            errorMessage = text;
          }
          // Extract error code if available
          if (json.code) {
            errorCode = json.code;
          }
        } catch {
          // If not JSON, use the text as is
          errorMessage = text;
        }
      }
    } catch {
      // If reading fails, use status text
      errorMessage = res.statusText;
    }
    
    // Create error with status and code
    const error: any = new Error(errorMessage);
    error.status = res.status;
    if (errorCode) {
      error.code = errorCode;
    }
    
    throw error;
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const sessionId = typeof window !== 'undefined' ? 
    localStorage.getItem('sessionId') || Math.random().toString(36).substring(2) + Date.now().toString(36) : 
    'server';

  if (typeof window !== 'undefined' && !localStorage.getItem('sessionId')) {
    localStorage.setItem('sessionId', sessionId);
  }

  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    "x-session-id": sessionId,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const sessionId = typeof window !== 'undefined' ? 
      localStorage.getItem('sessionId') || Math.random().toString(36).substring(2) + Date.now().toString(36) : 
      'server';

    if (typeof window !== 'undefined' && !localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', sessionId);
    }

    const headers: Record<string, string> = {
      "x-session-id": sessionId,
    };

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
