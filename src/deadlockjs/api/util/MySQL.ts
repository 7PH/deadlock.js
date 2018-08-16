import {Connection, MysqlError} from "mysql";


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
}
