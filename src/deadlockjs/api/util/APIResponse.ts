
/**
 * What to expect from the api
 */
export interface APIResponse {

    error?: {

        message: string;

        code: number;
    };

    data: any;
}
