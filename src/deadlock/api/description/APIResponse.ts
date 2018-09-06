
export interface APIResponse<T=any> {

    error?: {

        message: string;

        code: number;
    };

    data: T;
}
