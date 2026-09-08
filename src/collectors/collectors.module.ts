import { DiscoveryModule } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { CollectorsRegistry } from "./collectors.registry";
import { RssModule } from "src/rss/rss.module";

@Module({
  imports: [RssModule, DiscoveryModule],
  providers: [CollectorsRegistry],
  exports: [CollectorsRegistry],
})
export class CollectorsModule {}
