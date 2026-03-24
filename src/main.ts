import { NestFactory } from '@nestjs/core'; 
 import { ValidationPipe } from '@nestjs/common'; 
 import { AppModule } from './app.module'; 
 import { AllExceptionsFilter } from './common/filters/http-exception.filter'; 
 
 async function bootstrap() { 
   const app = await NestFactory.create(AppModule); 
 
   app.setGlobalPrefix('api/v1'); 
 
   app.useGlobalPipes( 
     new ValidationPipe({ 
       whitelist: true, 
       transform: true, 
     }), 
   ); 
 
   app.useGlobalFilters(new AllExceptionsFilter()); 
 
   app.enableCors({ origin: '*' }); 
 
   const port = process.env.PORT || 3000; 
   await app.listen(port, '0.0.0.0'); 
   console.log(`GoBron API: http://localhost:${port}/api/v1`); 
 } 
 bootstrap(); 
