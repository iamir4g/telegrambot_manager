# معماری کد — Feature-based

## اصول مشترک

- یک فیچر/ماژول = یک دامنه کسب‌وکار
- لایه‌ها نازک و تک‌مسئولیت
- ممنوع: god hook، god service، صفحه پر از منطق، controller پر از business logic
- `shared` به features وابسته نمی‌شود

## فرانت — `apps/admin`

```
src/
  app/                 # router, providers, layout
  shared/              # api client, ui پایه، utils
  features/
    <feature>/
      api/
      hooks/           # یک concern در هر hook
      model/           # types, schema, mappers
      ui/
      pages/           # view نازک: فقط wiring
      index.ts
```

### قواعد hooks

- `useFaqList` فقط لیست می‌گیرد
- `useFaqForm` فقط فرم create/edit
- `useApproveFaq` فقط mutation تأیید
- صفحه FAQ این‌ها را ترکیب می‌کند؛ منطق را داخل خودش نمی‌نویسد

## بک‌اند — `apps/api`

```
src/
  shared/              # prisma, crypto, guards پایه
  modules/
    <domain>/
      *.module.ts
      *.controller.ts  # نازک
      *-settings.service.ts / *-bot.service.ts / ...
      dto/
```

### قواعد service

- `AiOrchestratorService` فقط orchestration
- `KnowledgeRetrievalService` فقط بازیابی دانش
- `LlmClientService` فقط فراخوانی LLM
- `TelegramSettingsService` / `TelegramBotService` / `TelegramSenderService` جدا

## تنظیمات runtime

منبع حقیقت تنظیمات تلگرام و دانش بات: دیتابیس از طریق پنل.  
Env فقط برای bootstrap/seed و secretهای استقرار.
