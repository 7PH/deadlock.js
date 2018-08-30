

export interface ImportableMeta {
    table: string;
    fields: string[][];
}

export class ImportableHandler {

    /**
     *
     */
    public static readonly KEY: symbol = Symbol('importable');

    /**
     *
     * @param table
     * @returns
     * @constructor
     */
    public static Importable(table?: string) {

        return function(constructor: Function) {

            let metadata: ImportableMeta = Reflect.getMetadata(ImportableHandler.KEY, constructor)
                || {
                    table: null,
                    fields: []
                };

            metadata.table = table || constructor.name;

            Reflect.defineMetadata(ImportableHandler.KEY, metadata, constructor);
        };
    }

    /**
     * Define a property which is importable
     * @param fieldName
     */
    public static importable(fieldName?: string) {
        return function decorator(target: any, propName: string): void {

            let metadata: ImportableMeta = Reflect.getMetadata(ImportableHandler.KEY, target.constructor)
                || {
                    table: target.constructor.name,
                    fields: []
                };

            metadata.fields.push([propName, fieldName || propName]);

            Reflect.defineMetadata(ImportableHandler.KEY, metadata, target.constructor);
        }
    }
}


export const Importable = ImportableHandler.Importable;
export const importable = ImportableHandler.importable;
