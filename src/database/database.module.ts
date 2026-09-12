import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { databaseProvider } from './database.providers';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.constant';

@Module({
  providers: [...databaseProvider],
  exports: [...databaseProvider],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool
  ) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
