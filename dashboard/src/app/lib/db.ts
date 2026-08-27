import mysql, { RowDataPacket } from "mysql2/promise";
import { ObjConstructor } from "../types/main";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
})

// Queries the database returning an array of T arbitrary objects (can be model, arbitrary interface/json scheme).
export async function query<T>(
  sql: string | string[],
  asTransaction: boolean = false,
  Model: ObjConstructor<T> | null = null
): Promise<T[]> {
  let conn = null;
  try {
    conn = await pool.getConnection()

    if (asTransaction) await conn.beginTransaction()
    const [results] = await conn.query<RowDataPacket[]>(Array.isArray(sql) ? sql.join('\n') : sql)
    if (asTransaction) await conn.commit()

    return results.map((row) => {
      if (Model) {
        return new Model(row as T)
      }
      return row as T
    })
  } catch (err) {
    console.error(err)
  } finally {
    if (conn) conn.release()
  }

  return [] // empty results if issues.
}

// Queries the db and returns an array of array object results.
// export async function queryAll(sqlQueries: string[], ) {
//   // some query filtering for security (sql injection) here.

//   let conn = null
//   try {
//     conn = await pool.getConnection()

//     await conn.query("START TRANSACTION;")
//     const results = []
//     for (const query of sqlQueries) {
//       const [result]: object[][] = await conn.query<RowDataPacket[]>(query)
//       results.push(result)
//     }
//     await conn.query("COMMIT;")

//     return results
//   } catch {
//     if (conn) await conn.query("ROLLBACK;") // cancel changes.
//   } finally {
//     if (conn) conn.release() // release connection.
//   }
// }
