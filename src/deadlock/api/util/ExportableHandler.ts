import {Exportable} from "./Exportable";


export class ExportableHandler {

    /**
     *
     */
    public static KEY: symbol = Symbol('exportable');

    /**
     *
     */
    public static exportable() {
        return Reflect.metadata(ExportableHandler.KEY, true);
    }

    /**
     *
     * @param {Exportable} target
     * @param {string} key
     * @returns {boolean}
     */
    public static isExportable(target: Exportable, key: string): boolean {
        return Reflect.getMetadata(ExportableHandler.KEY, target, key);
    }

}

export const exportable = ExportableHandler.exportable;
export const isExportable = ExportableHandler.isExportable;
