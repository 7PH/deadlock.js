import {Connection} from "mysql";


export class MySQL {

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

        return new Promise<Class[]>((resolve, reject) => {
            mysql.query(rqt, data, (err, rows: any[]) => {
                if (err) return reject(err);
                else return resolve(rows.map(row => new Construct(row)));
            });
        });
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

        const rows: Class[] = await MySQL.query<Class>(mysql, rqt, Construct, data);
        if (rows.length == 0)
            throw new Error("Not found");
        return rows[0];
    }

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param entry
     * @returns {Promise<number>}
     */
    public static async insert(mysql: Connection, rqt: string, entry: any): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            mysql.query(rqt, entry, (err, rows: any) => {
                if (err) return reject(err);
                else return resolve(rows.insertId);
            });
        });
    }

    /**
     *
     * @param {Connection} mysql
     * @param {string} rqt
     * @param {Array<any>} data
     * @returns {Promise<void>}
     */
    public static async exec(mysql: Connection, rqt: string, data?: Array<any>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            mysql.query(rqt, data, (err, rows) => {
                if (err) return reject(err);
                else return resolve();
            });
        });
    }
}