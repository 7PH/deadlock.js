import * as express from "express";

export interface APIMiddleware {
    (req: express.Request, res: express.Response): Promise<void>;
}