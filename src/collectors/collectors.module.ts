import { Module } from '@nestjs/common';
import { CollectorsRegistry } from './collectors.registry';
import { RssModule } from 'src/rss/rss.module';

@Module({
    providers: [CollectorsRegistry],
    exports: [CollectorsRegistry],
    imports: [RssModule]
})
export class CollectorsModule {}
