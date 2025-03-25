import {open} from "sqlite";
import sqlite3 from "sqlite3";
import {createAll, upgradeAll} from "../schema";
import { logger } from "./logger";

export const DB = open({
    filename: 'api/data/global.db',
    driver: sqlite3.Database
}).then(async (db) => {
    await createAll(db);
    await upgradeAll(db);

    return db;
})

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function prepareAndAll(sql: string, params: any[]) : Promise<any[]> {
    const db = await DB;
    
    const stmt = await db.prepare(sql);
    const rows = await stmt.all(params);
    await stmt.finalize();

    return rows;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function prepareAndGet(sql: string, params: any[]) : Promise<any> {
    const db = await DB;
    
    const stmt = await db.prepare(sql);
    const row = await stmt.get(params);
    await stmt.finalize();

    return row;
}