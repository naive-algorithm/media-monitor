import { NestFactory } from "@nestjs/core";
import { ClassificationWorkerModule } from "./classification-worker/classification-worker.module";
import { ClassificationProcessor } from "./classification/queue/classification.processor";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    ClassificationWorkerModule,
  );
  app.enableShutdownHooks();

  const processor = app.get(ClassificationProcessor);
  await processor.worker.run();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
