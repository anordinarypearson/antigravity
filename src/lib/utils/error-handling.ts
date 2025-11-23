export type AppErrorType =
    | 'VALIDATION_ERROR'
    | 'NETWORK_ERROR'
    | 'AI_SERVICE_ERROR'
    | 'RATE_LIMIT_ERROR'
    | 'AUTH_ERROR'
    | 'UNKNOWN_ERROR';

export interface AppError {
    type: AppErrorType;
    message: string;
    originalError?: any;
}

export const ERROR_MESSAGES: Record<AppErrorType, string> = {
    VALIDATION_ERROR: "Please check your input and try again.",
    NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
    AI_SERVICE_ERROR: "The AI service is currently experiencing issues. Please try again later.",
    RATE_LIMIT_ERROR: "You've reached the usage limit. Please wait a moment before trying again.",
    AUTH_ERROR: "You need to be logged in to perform this action.",
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again."
};

export function createAppError(type: AppErrorType, originalError?: any, customMessage?: string): AppError {
    return {
        type,
        message: customMessage || ERROR_MESSAGES[type],
        originalError
    };
}

export function handleActionError(error: any): string {
    console.error("Action Error:", error);

    if (typeof error === 'string') return error;

    if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
        return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('__LIMIT_EXHAUSTED__')) {
        return ERROR_MESSAGES.RATE_LIMIT_ERROR;
    }

    if (error.message?.includes('timeout')) {
        return "The operation timed out. Please try again with a shorter input.";
    }

    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = "Operation timed out"): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([
        promise.then(result => {
            clearTimeout(timeoutHandle);
            return result;
        }),
        timeoutPromise
    ]);
}
