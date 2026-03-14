export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    error?: string;
}
