import "dotenv/config";
import mysql from "mysql2/promise";
import mariadb from "mariadb";

console.log("DB Host:", process.env.DATABASE_HOST);
console.log("DB User:", process.env.DATABASE_USER);
console.log("DB Port:", process.env.DATABASE_PORT);

async function testMysql2() {
  console.log("Testing mysql2...");
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("mysql2 success:", rows);
  } catch (err) {
    console.error("mysql2 failed:", err);
  } finally {
    await pool.end();
  }
}

async function testMariadb() {
  console.log("Testing mariadb...");
  const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 2,
    connectTimeout: 5000,
  });
  try {
    const conn = await pool.getConnection();
    console.log("mariadb connection retrieved");
    const rows = await conn.query("SELECT 1");
    console.log("mariadb success:", rows);
    conn.release();
  } catch (err) {
    console.error("mariadb failed:", err);
  } finally {
    await pool.end();
  }
}

async function run() {
  await testMysql2();
  await testMariadb();
}

run();
