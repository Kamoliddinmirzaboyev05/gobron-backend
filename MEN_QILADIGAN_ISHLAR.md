# Men qiladigan ishlar

## 1) Muhitni to'g'ri sozlash
- `.env.example` dan nusxa olib `.env` yarating.
- `.env` ichida quyidagilarni haqiqiy qiymatlar bilan to'ldiring:
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `TELEGRAM_BOT_TOKEN`
  - `SUPERADMIN_TELEGRAM_ID`

## 2) Prisma bazasini tayyorlash
- Supabase/PostgreSQL ishlayotganini tekshiring.
- Migratsiyalarni ishga tushiring:
  - `npx prisma migrate dev`
- Prisma clientni yangilang:
  - `npx prisma generate`

## 3) Loyihani ishga tushirishdan oldin tekshiruv
- Dependency o'rnatish:
  - `npm install`
- Kod sifati va testlar:
  - `npm run lint`
  - `npm run build`
  - `npm test`
  - `npm run test:e2e`

## 4) Xavfsizlik bo'yicha qolgan ishlar
- `npm audit` natijasida 13 ta zaiflik (11 moderate, 2 critical) bor.
- Asosiy risk `node-telegram-bot-api` ichidagi `request` zanjiridan kelmoqda.
- Yechim uchun:
  - Telegram kutubxonasini xavfsizroq alternativaga almashtirish yoki versiya strategiyasini qayta ko'rib chiqish.
  - Har o'zgarishdan keyin `npm audit` va testlarni qayta yugurish.

## 5) Ishga tushirish
- Development:
  - `npm run start:dev`
- Production build:
  - `npm run build && npm run start:prod`
