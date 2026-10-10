import { NestFactory } from "@nestjs/core";
import { IngestionWorkerModule } from "./ingestion-worker/ingestion-worker.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(IngestionWorkerModule);

  app.enableShutdownHooks();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
