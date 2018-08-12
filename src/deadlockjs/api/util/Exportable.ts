
/**
 * Something that can be imported or exported
 */
export interface Exportable {

    export(): object;

    import(d: string | object): void;
}
