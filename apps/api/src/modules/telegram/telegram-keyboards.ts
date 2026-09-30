export type InlineButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type ReplyMarkup =
  | {
      keyboard: Array<Array<{ text: string }>>;
      resize_keyboard: true;
      is_persistent?: boolean;
    }
  | {
      inline_keyboard: Array<Array<InlineButton>>;
    }
  | {
      remove_keyboard: true;
    };

export const MENU = {
  FAQ: '📋 سؤالات متداول',
  SCHEDULE: '📅 برنامه رویداد',
  REGISTER: '🎫 ثبت‌نام',
  SUPPORT: '🆘 پشتیبانی',
  HOME: '🏠 منوی اصلی',
} as const;

export function mainReplyKeyboard(): ReplyMarkup {
  return {
    resize_keyboard: true,
    is_persistent: true,
    keyboard: [
      [{ text: MENU.FAQ }, { text: MENU.SCHEDULE }],
      [{ text: MENU.REGISTER }, { text: MENU.SUPPORT }],
      [{ text: MENU.HOME }],
    ],
  };
}

export function optInInlineKeyboard(): ReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'بله، خبر بده', callback_data: 'optin:yes' },
        { text: 'الان نه', callback_data: 'optin:no' },
      ],
    ],
  };
}

export function faqInlineKeyboard(
  faqs: Array<{ id: string; question: string }>,
  page = 0,
  pageSize = 8,
): ReplyMarkup {
  const start = page * pageSize;
  const slice = faqs.slice(start, start + pageSize);
  const rows: Array<Array<InlineButton>> = slice.map((faq) => [
    {
      text: truncate(faq.question, 56),
      callback_data: `faq:${faq.id}`,
    },
  ]);

  const nav: InlineButton[] = [];
  if (page > 0) {
    nav.push({ text: 'قبلی', callback_data: `faqpage:${page - 1}` });
  }
  if (start + pageSize < faqs.length) {
    nav.push({ text: 'بعدی', callback_data: `faqpage:${page + 1}` });
  }
  if (nav.length) rows.push(nav);

  rows.push([{ text: 'سؤال دیگری دارم', callback_data: 'faq:ask' }]);
  return { inline_keyboard: rows };
}

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
