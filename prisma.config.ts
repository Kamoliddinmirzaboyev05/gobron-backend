import "dotenv/config"; 
 import { defineConfig } from "prisma/config"; 
 
 export default defineConfig({ 
   schema: "prisma/schema.prisma", 
   migrate: { 
     migrationsDir: "prisma/migrations", 
   }, 
 }); 
