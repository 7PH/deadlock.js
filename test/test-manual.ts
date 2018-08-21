import {APIDescription, RequestLocal} from "../src";
import {DeadLock} from "../src/deadlock";
import {ObjectFilter, RegExpFilter} from "io-filter";

const HOST: string = 'localhost';
const PORT: number = 48654;
const PATH: string = '/api/test';

let counter: number = 1;

const api: APIDescription = {

    verbose: true,

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

(async () => {

    await DeadLock.startApp(api);
})();
