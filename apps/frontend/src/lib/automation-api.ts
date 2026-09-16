import type {
  RestockSuggestionsResponse,
  GenerateAutoPOPayload,
  MarkdownRecommendationsResponse,
  ApplyMarkdownPayload,
} from '@/types/automation';

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data as T;
}

export const automationApi = {
  getRestockSuggestions: () => {
    return apiRequest<RestockSuggestionsResponse>('/api/automation/restock-suggestions');
  },

  generateAutoPO: (payload: GenerateAutoPOPayload) => {
    return apiRequest<any>('/api/automation/generate-auto-po', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMarkdownRecommendations: () => {
    return apiRequest<MarkdownRecommendationsResponse>('/api/automation/markdown-recommendations');
  },

  applyMarkdown: (payload: ApplyMarkdownPayload) => {
    return apiRequest<any>('/api/automation/apply-markdown', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
