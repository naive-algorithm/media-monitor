import { Pool } from "pg";
import { DATABASE_POOL } from "./database.constant";

export const databaseProvider = [
  {
    provide: DATABASE_POOL,
    useFactory: () => {
      return new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      })
    }
  }
]