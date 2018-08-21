import {IExportable} from "./IExportable";

/**
 * @TODO document
 * @TODO test
 */
export abstract class Exportable implements IExportable {

    public abstract fields?: string[];

    /**
     *
     * @param data
     * @returns {string}
     */
    public static stringify(data: any) {
        return JSON.stringify(data, Exportable.replacer);
    }

    /**
     *
     * @param {string} key
     * @param value
     * @returns {any}
     */
    public static replacer(key: string, value: any) {
        if (value instanceof Exportable)
            return value.export();
        return value;
    }

    /**
     *
     * @returns {object}
     */
    public export(): object {
        let data: any;
        if (typeof this.fields === 'undefined')
            data = this;
        else {
            data = {};
            for (let field of this.fields)
                data[field] = (<any>this)[field];
        }
        return data;
    }

    /**
     *
     * @param {string | object} data
     * @returns {this}
     */
    public import(data: string | object): this {

        let json: any = typeof data === 'string' ? JSON.parse(data) : data;

        for (let key in json) {

            if (! json.hasOwnProperty(key))
                continue;

            // current local value
            const localValue: any = (<any>this)[key];

            // attribute exists on the object but does not have the same type
            if (typeof localValue !== typeof json[key] && typeof localValue !== 'undefined')
                continue;

            // get the value
            const val: any = json[key];

            switch (typeof val) {

                // assigning a sub-object
                case 'object':

                    if (localValue instanceof Exportable)
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
