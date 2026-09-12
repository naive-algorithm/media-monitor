import { Pool } from "pg";
import { DATABASE_POOL } from "./database.constant";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { formatLogMessage } from "src/common/logging/format-log-message";

export const databaseProvider = [
  {
    provide: DATABASE_POOL,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const logger = new Logger("DatabasePool");
      const pool = new Pool({
        host: config.getOrThrow<string>("DB_HOST"),
        port: Number(config.getOrThrow<string>("DB_PORT")),
        user: config.getOrThrow<string>("DB_USER"),
        password: config.getOrThrow<string>("DB_PASSWORD"),
        database: config.getOrThrow<string>("DB_NAME"),
        max: 5,
        connectionTimeoutMillis: 3_000,
        idleTimeoutMillis: 30_000,
        statement_timeout: 10_000,
      });

      pool.on("error", (error) => {
        logger.error(
          formatLogMessage("PostgreSQL idle connection error", {
            cause: error,
          }),
        );
      });

      return pool;
    },
  },
];
