import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

  app.setGlobalPrefix("api");
  app.use(helmet());
  app.enableCors({
    origin: [origin, "http://localhost:3000"],
    credentials: true
  });
  const config = new DocumentBuilder()
    .setTitle("Powerlytic API")
    .setDescription("Industrial IoT monitoring, configuration, alerting, and actuation API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
}

bootstrap();
