
/**
 * Something that can be imported or exported
 */
export interface Exportable<T> {

    export(): T;

    import(d: T): void;
}
