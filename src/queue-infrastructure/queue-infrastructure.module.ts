import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.getOrThrow<string>("REDIS_HOST");
        const port = Number(config.getOrThrow<string>("REDIS_PORT"));

        if (!host.trim()) {
          throw new Error("REDIS_HOST must not be empty");
        }

        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error("REDIS_PORT must be an integer from 1 to 65535");
        }

        return {
          connection: {
            host,
            port,
          },
        };
      },
    }),
  ],
})
export class QueueInfrastructureModule {}
