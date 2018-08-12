import {Exportable} from "./Exportable";

/**
 * @TODO document
 * @TODO test
 */
export abstract class JSONExportable implements Exportable {

    public abstract fields: string[] | '*';

    public export(): object {
        let data: any;
        if (this.fields === '*')
            data = this;
        else {
            data = {};
            for (let field of this.fields)
                data[field] = (<any>this)[field];
        }
        return data;
    }

    public import(data: string | object): this {

        let json: any = typeof data === 'string' ? JSON.parse(data) : data;

        for (let key in json) {

            if (! json.hasOwnProperty(key))
                continue;

            // curr value of the value
            const localValue: any = (<any>this)[key];

            // attribute exists on the object but does not have the same type
            if (typeof localValue !== typeof json[key] && typeof localValue !== 'undefined')
                continue;

            // get the value
            const val: any = json[key];

            switch (typeof val) {

                // assigning a sub-object
                case 'object':

                    if (localValue instanceof JSONExportable)
                        // recursive import
                        localValue.import(val);
                    else
                        // default behaviour
                        (<any>this)[key] = val;

                    break;

                // just assign the property
                default:
                    (<any>this)[key] = val;
                    break;
            }
        }

        return this;
    }
}
