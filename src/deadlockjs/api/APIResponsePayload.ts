
/** All responses will match this interface */
export interface APIResponsePayload {
    /** meta data about the request */
    meta: {
        /** optional error */
        error?: {
            code: number;
            message: string;
        },
    };
    /** pagination */
    pagination?: {
        count: number;
        total: number;
        firstUrl: string;
        prevUrl: string;
        nextUrl: string;
        lastUrl: string;
    }
    /** data sent - can be anything, optional for post, put, delete calls */
    data?: any;
}