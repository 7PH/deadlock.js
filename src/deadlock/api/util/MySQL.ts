import {Connection, MysqlError} from "mysql";
import {Exportable} from "./Exportable";
import {ImportableHandler, ImportableMeta} from "./ImportableHandler";


export class MySQL {

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param data
     * @returns {Promise<any>}
     * @private
     */
    public static async awaitQuery(mysql: Connection, rqt: string, data?: any): Promise<any> {
        console.log(rqt, data);
        return new Promise<any>((resolve, reject) => {
            mysql.query(rqt, data, (err: MysqlError | null, data: any) => {
                if (err)
                    reject(err);
                else
                    resolve(data);
            });
        });
    }

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param {{new(data: any): Class}} Construct
     * @param {Array<any>} data
     * @returns {Promise<Class[]>}
     */
    public static async query<Class>(
        mysql: Connection,
        rqt: string,
        Construct: new(data: any) => Class,
        data?: Array<any>
    ): Promise<Class[]> {

        const rows: any[] = await MySQL.awaitQuery(mysql, rqt, data);
        return rows.map(row => new Construct(row));
    }

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param {{new(data: any): Class}} Construct
     * @param {Array<any>} data
     * @returns {Promise<Class>}
     */
    public static async getFirst<Class>(
        mysql: Connection,
        rqt: string,
        Construct: new(data: any) => Class,
        data?: Array<any>
    ): Promise<Class> {

        const rows: any[] = await MySQL.awaitQuery(mysql, rqt, data);
        if (rows.length === 0)
            throw new Error("No result");
        return new Construct(rows[0]);
    }

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param entry
     * @returns {Promise<number>}
     */
    public static async insert(mysql: Connection, rqt: string, entry: any): Promise<number> {

        let result: any = await MySQL.awaitQuery(mysql, rqt, entry);
        return result.insertId;
    }

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param {Array<any>} data
     * @returns {Promise<void>}
     */
    public static async exec(mysql: Connection, rqt: string, data?: Array<any>): Promise<void> {

        await MySQL.awaitQuery(mysql, rqt, data);
    }

    /**
     *
     * @param {Connection} mysql
     * @param {{new(data: any): Class}} Construct
     * @param rqt
     * @param {Array<any>} data
     * @returns {Promise<Class[]>}
     */
    public static async fetch<Class extends Exportable=Exportable>(
        mysql: Connection,
        Construct: new(data: any) => Class,
        rqt?: string,
        data?: Array<any>
    ): Promise<Class[]> {

        const importableData: {fields: string, table: string} | undefined = MySQL.getImportableData(Construct);
        if (typeof importableData === 'undefined')
            throw new Error("Error using Importable object");

        const query: string = `SELECT ${importableData.fields} FROM ${importableData.table} ${rqt || ''}`;
        const rows: any[] = await MySQL.awaitQuery(mysql, query, data);
        return rows.map(row => new Construct(row));
    }

    /**
     *
     * @param {Connection} mysql
     * @param {{new(data: any): Class}} Construct
     * @param id
     * @returns {Promise<Class[]>}
     */
    public static async fetchById<Class extends Exportable=Exportable>(
        mysql: Connection,
        Construct: new(data: any) => Class,
        id: number
    ): Promise<Class> {

        return (await MySQL.fetch(mysql, Construct, `WHERE id = ?`, [id]))[0];
    }

    /**
     *
     * @param {Connection} mysql
     * @param {{new(data: any): Class}} Construct
     * @param ids
     * @returns {Promise<Class[]>}
     */
    public static async fetchByIds<Class extends Exportable=Exportable>(
        mysql: Connection,
        Construct: new(data: any) => Class,
        ids: number[]
    ): Promise<Class[]> {

        if (ids.length === 0)
            return [];

        return MySQL.fetch(mysql, Construct, `WHERE id IN (?)`, [ids]);
    }

    /**
     *
     * @param {Connection} mysql
     * @param instance
     * @returns {Promise<void>}
     */
    public static insertEntity<Class>(mysql: Connection, instance: Class): Promise<number> {

        let data: ImportableMeta | undefined = Reflect.getMetadata(ImportableHandler.KEY, instance.constructor);

        if (typeof data === 'undefined')
            throw new Error("Unable to fetch metadata about the object");

        let entries: string[] = [];
        let fields: string[] = [];
        data.fields
            .forEach(field => {
                if (field.primary)
                    return;

                let value: any = (<any>instance)[field.propName];
                if (typeof value === 'undefined')
                    throw new Error(`The property ${field.propName} should exist on object ${instance.constructor}`);

                entries.push(value.toString());
                fields.push(field.fieldName);
            });

        let fieldsQuery: string = fields.map(field => `\`${field}\``).join(',');
        let questionMarks: string = fields.map(() => '?').join(',');
        let rqt: string = `INSERT INTO ${data.table} (${fieldsQuery}) VALUES (${questionMarks})`;

        return MySQL.insert(mysql, rqt, entries);
    }

    /**
     *
     * @param {typeof Exportable} Obj
     * @returns {string}
     */
    public static getImportableData(Obj: new(data: any) => Exportable): {fields: string, table: string} | undefined {

        let data: ImportableMeta | undefined = Reflect.getMetadata(ImportableHandler.KEY, Obj);

        if (typeof data === 'undefined')
            return;

        return {
            fields: data.fields
                .map(field => `\`${(data as any).table}\`.\`${field.fieldName}\` as \`${field.propName}\``)
                .join(','),
            table: data.table
        };
    }
}
