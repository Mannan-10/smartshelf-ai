export async function readJsonSafely<T>(response: Response): Promise<T | null> {
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

export function getApiErrorMessage(data: unknown, fallback: "Something went wrong"): string {
    const response = data as {
        message?: string | string[];
        error?: string;
    };

    if (Array.isArray(response?.message)) {
        return response.message.join(", ");
    }

    return response?.message ?? response?.error ?? fallback;
}