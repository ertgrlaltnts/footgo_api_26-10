import { config } from 'dotenv';
config(); // .env dosyasını yükle

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // NestJS'in varsayılan body-parser'ını devre dışı bırak
  });

  // JSON body limiti artır (büyük tahmin verileri için)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // CORS'u aktif et (Herkes erişebilir)
  app.enableCors({
    origin: true, // Tüm origin'lere izin ver
    credentials: true, // Authentication gerektirmez
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe'ı etkinleştir
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // DTO'da tanımlanmayan alanları kaldırma
      forbidNonWhitelisted: false, // DTO'da olmayan alanlar için hata verme
      transform: true, // Gelen veriyi otomatik olarak DTO tipine dönüştür
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
