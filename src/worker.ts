import { NestFactory } from "@nestjs/core";
import { AppWorkerModule } from "./app-worker/app-worker.module";

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppWorkerModule);

    app.enableShutdownHooks();
}

bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
})