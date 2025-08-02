import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('🚀 Starting Owtdeparq Backend...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', process.env.PORT || 3000);
    console.log('Database URL present:', !!process.env.DATABASE_URL);
    
    console.log('📦 Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    console.log('✅ NestJS application created successfully');

    // Enable CORS for frontend communication
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://owtdeparq-frontend-production.up.railway.app',
        process.env.FRONTEND_URL,
        process.env.RAILWAY_SERVICE_OWTDEPARQ_FRONTEND_URL ? `https://${process.env.RAILWAY_SERVICE_OWTDEPARQ_FRONTEND_URL}` : null
      ].filter(Boolean),
      credentials: true,
    });
    console.log('✅ CORS enabled');

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    console.log('✅ Global validation pipe configured');

    // API prefix
    app.setGlobalPrefix('api');
    console.log('✅ Global prefix set to /api');

    // Swagger documentation setup
    const config = new DocumentBuilder()
      .setTitle('Owtdeparq API')
      .setDescription('Backend API for Owtdeparq - AI-powered pitch deck generation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log('✅ Swagger documentation configured');

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🎉 Application is running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
    console.log(`❤️  Health check available at: http://localhost:${port}/api/health`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch(error => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
