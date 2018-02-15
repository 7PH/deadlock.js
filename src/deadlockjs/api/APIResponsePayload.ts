

export interface APIResponsePayload {
    meta: {
        error?: {
            code: number;
            message: string;
        },
        cached?: boolean;
    };
    pagination?: {
        nextUrl: string;
        nextMaxId: number;
    }
    data?: any;
}