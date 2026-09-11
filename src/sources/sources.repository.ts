import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from 'src/database/database.constant';
import { Source } from './source.entity';
import { NewSource } from './new-source.type';

@Injectable()
export class SourcesRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToSource(row: any): Source {
    return new Source(
      row.id,
      row.name,
      row.url,
      row.collector_type,
      row.is_enabled,
      row.last_collected_at,
    );
  }

  public async findAll(): Promise<Source[]> {
    const result = await this.pool.query(`SELECT * FROM sources`);
    return result.rows.map((row) => this.mapRowToSource(row));
  }

  public async findEnabled(): Promise<Source[]> {
    const result = await this.pool.query(
      `SELECT * FROM sources WHERE is_enabled = true`,
    );
    return result.rows.map((row) => this.mapRowToSource(row));
  }

  public async findById(id: number): Promise<Source | undefined> {
    const result = await this.pool.query(
      `SELECT * FROM sources WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return undefined;
    }
    return this.mapRowToSource(result.rows[0]);
  }

  public async findByName(name: string): Promise<Source> {
    const result = await this.pool.query(
      `SELECT * FROM sources WHERE name = $1`,
      [name],
    );
    return this.mapRowToSource(result.rows[0]);
  }

  public async create(source: NewSource): Promise<Source> {
    const result = await this.pool.query(
      `INSERT INTO sources (name, url, collector_type, is_enabled) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        source.name,
        source.url,
        source.collectorType,
        source.isEnabled,
      ],
    );

    return this.mapRowToSource(result.rows[0]);
  }

  public async update(source: Source): Promise<Source> {
    const result = await this.pool.query(
      `UPDATE sources 
      SET name = $1, url = $2, collector_type = $3, is_enabled = $4, last_collected_at = $5 
      WHERE id = $6 
      RETURNING *
      `,
      [
        source.name,
        source.url,
        source.collectorType,
        source.isEnabled,
        source.lastCollectedAt,
        source.id,
      ],
    );

    return this.mapRowToSource(result.rows[0]);
  }

  public async updateLastCollectedAt(sourceId: number) {
    await this.pool.query(
      `UPDATE sources SET last_collected_at = NOW() WHERE id = $1`,
      [sourceId],
    );
  };

  public async disableSource(sourceId: number): Promise<Source | undefined> {
    const result = await this.pool.query(
      `UPDATE sources SET is_enabled = false WHERE id = $1
       RETURNING *`,
      [sourceId]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapRowToSource(result.rows[0]);
  }

  public async enableSource(sourceId: number): Promise<Source | undefined> {
    const result = await this.pool.query(
      `UPDATE sources SET is_enabled = true WHERE id = $1
       RETURNING *`,
      [sourceId]
    )

    if (result.rows.length === 0) {
      return undefined;
    }
    return this.mapRowToSource(result.rows[0]);
  }

  public async delete(id: number) {
    await this.pool.query('DELETE FROM sources WHERE id = $1', [id]);
  }
}
