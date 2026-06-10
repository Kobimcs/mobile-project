import { API_BASE_URL } from '../constants/config';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiRequestOptions = {
    method?: RequestMethod;
    body?: unknown;
    token?: string | null;
};

export async function apiRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, token } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || 'Something went wrong. Please try again.');
    }

    return data as T;
}