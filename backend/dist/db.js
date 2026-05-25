"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDbAvailable = isDbAvailable;
exports.getPool = getPool;
exports.initDb = initDb;
const mssql_1 = __importDefault(require("mssql"));
const config = {
    server: "hpathway.database.windows.net",
    database: "hpathway1",
    port: 1433,
    user: process.env.DB_USER || "hpathway",
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000,
    },
};
let pool = null;
let dbAvailable = true;
function isDbAvailable() {
    return dbAvailable;
}
async function getPool() {
    if (!pool || !pool.connected) {
        pool = await mssql_1.default.connect(config);
        dbAvailable = true;
    }
    return pool;
}
async function initDb() {
    const p = await getPool();
    await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'triage_sessions')
    CREATE TABLE triage_sessions (
      id            NVARCHAR(36)   NOT NULL PRIMARY KEY,
      crisis_level  NVARCHAR(50)   NOT NULL DEFAULT 'hub',
      status        NVARCHAR(50)   NOT NULL DEFAULT 'in_progress',
      created_at    NVARCHAR(50)   NOT NULL,
      completed_at  NVARCHAR(50),
      name          NVARCHAR(255),
      email         NVARCHAR(255),
      phone         NVARCHAR(50),
      address       NVARCHAR(500),
      wants_call    NVARCHAR(50),
      notes         NVARCHAR(MAX),
      flags         NVARCHAR(MAX)
    )
  `);
    // Migrate existing tables: add columns if they don't exist
    await p.request().query("IF COL_LENGTH('triage_sessions', 'email') IS NULL ALTER TABLE triage_sessions ADD email NVARCHAR(255)");
    await p.request().query("IF COL_LENGTH('triage_sessions', 'wants_call') IS NULL ALTER TABLE triage_sessions ADD wants_call NVARCHAR(50)");
    await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'session_answers')
    CREATE TABLE session_answers (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      session_id  NVARCHAR(36)  NOT NULL REFERENCES triage_sessions(id),
      step        INT           NOT NULL,
      answer      NVARCHAR(MAX) NOT NULL
    )
  `);
    await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'human_chat_messages')
    CREATE TABLE human_chat_messages (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      session_id  NVARCHAR(36)  NOT NULL REFERENCES triage_sessions(id),
      sender      NVARCHAR(10)  NOT NULL,
      message     NVARCHAR(MAX) NOT NULL,
      created_at  NVARCHAR(50)  NOT NULL
    )
  `);
}
