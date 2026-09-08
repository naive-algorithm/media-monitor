import { Module } from '@nestjs/common';
import { RssCollector } from './rss.collector';

@Module({
  providers: [RssCollector],
  exports: [RssCollector],
})
export class RssModule {}
