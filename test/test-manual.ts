import * as express from "express";

import {APIDescription} from "../src";
import {DeadLock} from "../src/deadlock";

const HOST: string = 'localhost';
const PORT: number = 48654;
const PATH: string = '/api/test';

const api: APIDescription = {

    verbose: true,

    hostname: HOST,

    port: PORT,

    basePath: PATH,

    routes: {

        '/dir': {
            middlewares: [
                async (req: express.Request, res: express.Response): Promise<void> => {
                    console.log('directory middleware 1');
                },
                async (req: express.Request, res: express.Response): Promise<void> => {
                    console.log('directory middleware 2');
                }
            ],
            routes: {
                '/route': {
                    middlewares: [
                        async (req: express.Request, res: express.Response): Promise<void> => {
                            console.log('end point middleware 1');
                        },
                        async (req: express.Request, res: express.Response): Promise<void> => {
                            console.log('end point middleware 2');
                        },
                    ],
                    handler: async () => {
                        console.log('handler');
                        return "returned value";
                    }
                }
            }
        }
    }
};

(async () => {

    await DeadLock.startApp(api);
})();
