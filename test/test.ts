import {APIDescription, APIRouteType, DeadLockJS, RequestLocal} from "../src";
import * as request from "request-promise-native"

const HOST: string = 'localhost';
const PORT: number = 48654;
const PATH: string = '/api/test';

const api: APIDescription = {
    appSecret: '',
    workers: 1,
    cors: {
        origin: 'http://localhost:3000'
    },
    hostname: HOST,
    port: PORT,
    root: {
        kind: APIRouteType.DIRECTORY,
        middleware: [],
        path: PATH,
        routes: [
            {
                kind: APIRouteType.END_POINT,
                path: '/get',
                method: 'get',
                handler: async (dl: RequestLocal) => { return { a: 2 }; }
            },
            {
                kind: APIRouteType.END_POINT,
                path: '/post',
                method: 'post',
                handler: async (dl: RequestLocal) => { return { a: 3 }; }
            }
        ]
    }
};

describe('DeadLockJS test', function () {

    /** Setup server */
    beforeEach(async function () {
        this.httpServer = await DeadLockJS.startApp(api);
        this.baseUrl = 'http://' + HOST + ':' + PORT + PATH + '/';
    });

    /** Stops server */
    afterEach(async function() {
        return new Promise(resolve => this.httpServer.close(resolve));
    });

    /** Quit */
    after(() => {
        process.exit();
    });

    /** Get */
    it('get', async function () {
        const url: string = this.baseUrl + 'get';
        let result: any = JSON.parse(await request.get(url));
        if (! result || ! result.data || ! result.data.a || result.data.a !== 2)
            throw new Error("GET error");
    });

    /** POST */
    it('post', async function () {
        const url: string = this.baseUrl + 'post';
        let result: any = JSON.parse(await request.post(url));
        if (! result || ! result.data || ! result.data.a || result.data.a !== 3)
            throw new Error("POST error");
    });

});