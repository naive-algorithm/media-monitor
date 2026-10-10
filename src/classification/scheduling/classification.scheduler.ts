import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ClassificationProducer } from "../queue/classification.producer";
import { formatLogMessage } from "src/common/logging/format-log-message";

@Injectable()
export class ClassificationScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ClassificationScheduler.name);
  private scheduling = false;
  constructor(private readonly producer: ClassificationProducer) {}

  async schedulePendingClassifications(): Promise<void> {
    if (this.scheduling) return;
    this.scheduling = true;
    try {
      await this.producer.enqueuePendingClassifications();

      this.logger.log("Classification enqueue pass completed");
    } catch (error: unknown) {
      this.logger.error(
        formatLogMessage("Failed to enqueue pending classifications", {
          cause: error,
        }),
      );
    } finally {
      this.scheduling = false;
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.schedulePendingClassifications();
  }

  @Cron("*/10 * * * *")
  async runScheduledClassification(): Promise<void> {
    await this.schedulePendingClassifications();
  }
}
