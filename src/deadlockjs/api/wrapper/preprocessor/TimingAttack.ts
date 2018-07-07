import {Preprocessor} from "./Preprocessor";
import {APIEndPoint, RequestLocal} from "../../../../";
import {Request, Response} from "express";
import {PromiseCaching} from "promise-caching";

export class TimingAttack implements Preprocessor {

    public static get CACHE_DURATION(): number { return 60 * 1000; }

    private cache: PromiseCaching = new PromiseCaching();

    public async delay(min: number, max: number, loc: RequestLocal): Promise<void> {
        let serialized: string = JSON.stringify(loc.requestInfo.params);
        let expire: number = TimingAttack.CACHE_DURATION;
        let delayDuration: number = await this.cache.get(serialized, expire, async () => {
            return min + Math.random() * (max - min);
        });

        return new Promise<void>(resolve => setTimeout(resolve.bind(this), delayDuration));
    }

    public async preprocess(endPoint: APIEndPoint, req: Request, res: Response): Promise<void> {
        if (typeof endPoint.timingAttack !== 'undefined') {
            const min: number = endPoint.timingAttack.minDelay;
            const max: number = endPoint.timingAttack.minDelay;
            await this.delay(min, max, res.locals);
        }
    }

}