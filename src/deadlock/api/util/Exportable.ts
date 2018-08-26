import "reflect-metadata";
import {IExportable} from "./IExportable";


export abstract class Exportable implements IExportable {

    public static metaKey: symbol = Symbol('exportable');

    /**
     *
     */
    public static exportable() {
        return Reflect.metadata(Exportable.metaKey, true);
    }

    /**
     *
     * @param {Exportable} target
     * @param {string} key
     * @returns {boolean}
     */
    public static isExportable(target: Exportable, key: string): boolean {
        return Reflect.getMetadata(Exportable.metaKey, target, key);
    }

    /**
     *
     * @returns {string}
     */
    public static stringify(exportable: Exportable): string {
        return JSON.stringify(exportable, this.replacer);
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
     * @param {object | string} data
     */
    constructor(data?: object | string) {

        if (typeof data !== 'undefined')
            this.import(data);
    }

    /**
     *
     * @returns {object}
     */
    public export(): object {
        let data: any = {};
        for (let field in this)
            if (this.hasOwnProperty(field))
                if (Exportable.isExportable(this, field))
                    data[field] = this[field];
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


export const exportable = Exportable.exportable;
export const isExportable = Exportable.isExportable;
