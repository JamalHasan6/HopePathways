import sql from "mssql";
export declare function isDbAvailable(): boolean;
export declare function getPool(): Promise<sql.ConnectionPool>;
export declare function initDb(): Promise<void>;
