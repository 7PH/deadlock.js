

export interface ImportableMeta {
    table: string;
    fields: FieldMeta[];
}

export interface FieldMeta {
    propName: string;
    fieldName: string;
    primary: boolean;
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
     * @param field
     */
    public static importable(field?: string | Partial<{fieldName: string, primary: boolean}>) {
        return function decorator(target: any, propName: string): void {

            let metadata: ImportableMeta = Reflect.getMetadata(ImportableHandler.KEY, target.constructor)
                || {
                    table: target.constructor.name,
                    fields: []
                };

            let fieldObject: FieldMeta;
            if (typeof field === 'string')
                fieldObject = {
                    fieldName: field,
                    propName,
                    primary: false
                };
            else if (typeof field === 'object')
                fieldObject = {
                    fieldName: field.fieldName || propName,
                    primary: typeof field.primary === 'undefined' ? false : field.primary,
                    propName
                };
            else
                fieldObject = {
                    fieldName: propName,
                    primary: false,
                    propName
                };

            metadata.fields.push(fieldObject);

            Reflect.defineMetadata(ImportableHandler.KEY, metadata, target.constructor);
        }
    }
}


export const Importable = ImportableHandler.Importable;
export const importable = ImportableHandler.importable;
