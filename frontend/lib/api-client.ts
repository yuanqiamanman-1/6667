const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

// Types
interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const apiClient = {
  // GET request
  get: async <T>(url: string, token?: string): Promise<T> => {
    return request<T>(url, { method: 'GET', token });
  },

  // POST request
  post: async <T>(url: string, body: any, token?: string): Promise<T> => {
    return request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      token,
    });
  },

  // PUT request
  put: async <T>(url: string, body: any, token?: string): Promise<T> => {
    return request<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      token,
    });
  },

  patch: async <T>(url: string, body: any, token?: string): Promise<T> => {
    return request<T>(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      token,
    })
  },

  // DELETE request
  delete: async <T>(url: string, token?: string): Promise<T> => {
    return request<T>(url, { method: 'DELETE', token });
  },
  
  // Form Post (for OAuth2)
  postForm: async <T>(url: string, formData: FormData): Promise<T> => {
    return request<T>(url, {
      method: 'POST',
      body: formData,
    });
  },

  postFormAuth: async <T>(url: string, formData: FormData, token?: string): Promise<T> => {
    return request<T>(url, {
      method: 'POST',
      body: formData,
      token,
    })
  },
};

function joinUrl(base: string, path: string) {
  if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  
  const config: RequestInit = {
    ...rest,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const url = endpoint.startsWith('http') ? endpoint : joinUrl(API_BASE_URL, endpoint);

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(response.status, errorData.detail || 'Request failed', errorData);
  }

  return response.json();
}
