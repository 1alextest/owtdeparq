import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppTestModule } from './app-test.module';

async function bootstrap() {
  const app = await NestFactory.create(AppTestModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AI Pitch Deck Generator API - Test')
    .setDescription('Test version of the AI Pitch Deck Generator API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Test server running on: http://localhost:${port}`);
  console.log(`📚 API docs available at: http://localhost:${port}/api`);
  console.log('✅ Basic NestJS structure is working!');
}

bootstrap().catch(error => {
  console.error('❌ Failed to start test server:', error);
});
