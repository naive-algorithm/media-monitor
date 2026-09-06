import { Module } from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import { SourcesService } from './sources.service';
import { SourcesRepository } from './sources.repository';
import { SourcesController } from './sources.controller';

@Module({
  imports: [DatabaseModule],
  providers: [SourcesService, SourcesRepository],
  exports: [SourcesService],
  controllers: [SourcesController]
})
export class SourcesModule {}
