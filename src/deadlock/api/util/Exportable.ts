import "reflect-metadata";
import {IExportable} from "./IExportable";


export interface ImportableMeta {
    table: string;
    fields: string[][];
}

export abstract class Exportable implements IExportable {

    public static importKey: symbol = Symbol('importable');
    public static exportKey: symbol = Symbol('exportable');

    /**
     *
     * @param table
     * @returns
     * @constructor
     */
    public static Importable(table?: string) {

        return function(constructor: Function) {

            let metadata: ImportableMeta = Reflect.getMetadata(Exportable.importKey, constructor)
                || {
                    table: null,
                    fields: []
                };

            metadata.table = table || constructor.name;

            Reflect.defineMetadata(Exportable.importKey, metadata, constructor);
        };
    }

    /**
     * Define a property which is importable
     * @param fieldName
     */
    public static importable(fieldName?: string) {
        return function decorator(target: any, propName: string): void {
            console.log("importable", target.constructor, fieldName, propName);

            let metadata: ImportableMeta = Reflect.getMetadata(Exportable.importKey, target.constructor)
                || {
                    table: target.constructor.name,
                    fields: []
                };

            metadata.fields.push([propName, fieldName || propName]);

            Reflect.defineMetadata(Exportable.importKey, metadata, target.constructor);
        }
    }

    /**
     *
     */
    public static exportable() {
        return Reflect.metadata(Exportable.exportKey, true);
    }

    /**
     *
     * @param {Exportable} target
     * @param {string} key
     * @returns {boolean}
     */
    public static isExportable(target: Exportable, key: string): boolean {
        return Reflect.getMetadata(Exportable.exportKey, target, key);
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
     * @returns {string[]}
     */
    public getFields(): string[] {
        const fields: string[] = [];
        for (let field in this)
            if (this.hasOwnProperty(field))
                fields.push(field);
        return fields;
    }

    /**
     *
     * @returns {object}
     */
    public export(): object {
        const fields: string[] = this.getFields();
        let data: any = {};
        for (let field of fields)
            if (Exportable.isExportable(this, field))
                data[field] = (this as any)[field];
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
export const Importable = Exportable.Importable;
export const importable = Exportable.importable;
export const isExportable = Exportable.isExportable;
