import * as express from 'express';

export interface APIEndPointHandler {
    (req: express.Request, res: express.Response): Promise<any>;
}