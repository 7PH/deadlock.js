import {Preprocessor} from "./Preprocessor";
import {APIEndPoint} from "../../../../";
import {Request, Response} from "express";

export class TimingAttack implements Preprocessor {

    public preprocess(endPoint: APIEndPoint, req: Request, res: Response): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            if (typeof endPoint.timingAttack === 'undefined')
                return resolve();

            const delay: number = endPoint.timingAttack.minDelay
                + Math.random()
                * (endPoint.timingAttack.maxDelay - endPoint.timingAttack.minDelay);

            setTimeout(resolve, delay);
        });
    }

}