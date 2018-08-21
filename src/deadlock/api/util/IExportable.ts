
/**
 * Something that can be imported or exported
 */
export interface IExportable {

    export(): object;

    import(d: string | object): void;
}
