import {APIDescription, RequestLocal} from "../src";
import * as request from "request-promise-native"
import {DeadLockJS} from "../src/deadlockjs";
import {ObjectFilter, RegExpFilter} from "io-filter";

const HOST: string = 'localhost';
const PORT: number = 48654;
const PATH: string = '/api/test';

let counter: number = 1;

const api: APIDescription = {

    hostname: HOST,

    port: PORT,

    basePath: PATH,

    routes: {
        // test suite 1
        '/': async () => "ok",

        // test suite 2
        '/get1': {
            method: 'get',
            handler: async () => ({ a: 2 })
        },
        '/get2': {
            method: 'get',
            handler: async () => { (<any>{}).x.y = 1; return 2; }
        },
        '/post1': {
            method: 'post',
            handler: async () => ({ a: 3 })
        },

        // test suite 3
        '/post2': {
            method: 'post',
            paramFilter: new ObjectFilter({user: new RegExpFilter(/^[0-9]+$/)}),
            handler: async (dl: RequestLocal) => dl.requestInfo.params
        },

        // test suite 4
        '/get3': {
            method: 'get',
            cache: { expire: 500 },
            handler: async () => counter ++
        }
    }
};


function sleep(duration: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, duration));
}

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

    describe('api description', function () {

        /** Default path 1 */
        it('default path should be \'/\'', async function () {
            const url: string = this.baseUrl;
            let result: any = JSON.parse(await request.get(url));
            if (!result || !result.data || !result.data || result.data !== "ok")
                throw new Error("Wrong response");
        });

        /** Default path 2 */
        it('default path should be \'/\'', async function () {
            const url: string = this.baseUrl + "/nopenopenope";
            let result: any = JSON.parse(await request.get(url, {simple: false}));
            if (! result || ! result.error || result.error.code !== 404)
                throw new Error("Wrong response");
        });

    });

    describe('basic calls', function () {

        /** Get */
        it('get', async function () {
            const url: string = this.baseUrl + 'get1';
            let result: any = JSON.parse(await request.get(url));
            if (!result || !result.data || !result.data.a || result.data.a !== 2)
                throw new Error("Wrong response");
        });

        /** 500 error */
        it('status 500', async function () {
            const url: string = this.baseUrl + 'get2';
            let result: any = JSON.parse(await request.get(url, {simple: false}));
            if (! result || ! result.error || result.error.code !== 500)
                throw new Error("Wrong response");
        });

        /** POST */
        it('post', async function () {
            const url: string = this.baseUrl + 'post1';
            let result: any = JSON.parse(await request.post(url));
            if (! result || ! result.data || ! result.data.a || result.data.a !== 3)
                throw new Error("Wrong response");
        });
    });

    describe('post parameter filter', function () {

        /** POST */
        it('post', async function () {
            const url: string = this.baseUrl + 'post2';
            let result: any = JSON.parse(await request.post(url, {form: {user: 12}}));
            if (! result || ! result.data || ! result.data.user || result.data.user !== '12')
                throw new Error("Wrong response");
        });
    });

    describe('cache', function () {

        /** Get */
        it('cache hit & expire', async function () {

            this.slow(3000);

            const url: string = this.baseUrl + 'get3';

            let result: any = JSON.parse(await request.get(url));

            if (! result || ! result.data || ! result.data)
                throw new Error("Expected value");

            let oldRand: number = result.data;

            result = JSON.parse(await request.get(url));

            if (! result || ! result.data || ! result.data)
                throw new Error("Expected value");

            if (result.data !== oldRand)
                throw new Error("Expected cache hit");

            await sleep(1000);

            result = JSON.parse(await request.get(url));

            if (! result || ! result.data || ! result.data)
                throw new Error("Expected value");

            if (result.data === oldRand)
                throw new Error("Unexpected cache hit");
        });

    })

});
