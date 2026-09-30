export type TelegramLinkButton = {
  text: string;
  url: string;
};

export type TelegramPayload = {
  text: string;
  linkButtons: TelegramLinkButton[];
};

/**
 * Convert TipTap/editor HTML into Telegram-compatible HTML + URL buttons.
 *
 * Monospace → <code> (single-line, tap-to-copy in Telegram).
 * Multiline code → <pre>.
 * Links → removed from body text and attached as inline URL buttons.
 */
export function buildTelegramPayload(input: string): TelegramPayload {
  if (!input) return { text: '', linkButtons: [] };

  const linkButtons: TelegramLinkButton[] = [];
  const seenUrls = new Set<string>();

  const pushLink = (url: string, label?: string) => {
    const href = url.trim();
    if (!isValidHttpUrl(href) || seenUrls.has(href) || linkButtons.length >= 8) {
      return;
    }
    seenUrls.add(href);
    linkButtons.push({
      text: truncateButton((label ?? href).trim() || href),
      url: href,
    });
  };

  let html = input
    .replace(/\r\n/g, '\n')
    .replace(/&nbsp;/gi, ' ');

  // If editor somehow stored escaped tags as text, decode once before parsing
  if (/&lt;\/?(?:pre|code|b|i|em|strong)/i.test(html)) {
    html = decodeHtmlEntities(html);
  }

  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div\b[^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<h[1-6]\b[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n')
    .replace(/<\/?span\b[^>]*>/gi, '');

  // Extract links first (including links wrapped in code)
  html = html.replace(
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, labelHtml: string) => {
      const label = decodeHtmlEntities(stripTags(labelHtml)).trim() || href;
      pushLink(href, label);
      return LABEL_PLACEHOLDER(label);
    },
  );

  // TipTap code block: <pre><code>...</code></pre> or <pre>...</pre>
  html = html.replace(
    /<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_m, inner: string) => formatMonospace(decodeHtmlEntities(stripTags(inner)), pushLink),
  );
  html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner: string) => {
    return formatMonospace(decodeHtmlEntities(stripTags(inner)), pushLink);
  });

  // Inline code
  html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner: string) => {
    return formatMonospace(decodeHtmlEntities(stripTags(inner)), pushLink);
  });

  // Restore link labels (plain text; URL is on the button)
  html = html.replace(/§§LABEL§§([\s\S]*?)§§ENDLABEL§§/g, (_m, label: string) =>
    escapeTelegramText(label),
  );

  // Bold / italic / underline / strike
  html = html
    .replace(/<strong\b[^>]*>/gi, '<b>')
    .replace(/<\/strong>/gi, '</b>')
    .replace(/<b\b[^>]*>/gi, '<b>')
    .replace(/<\/b>/gi, '</b>')
    .replace(/<em\b[^>]*>/gi, '<i>')
    .replace(/<\/em>/gi, '</i>')
    .replace(/<i\b[^>]*>/gi, '<i>')
    .replace(/<\/i>/gi, '</i>')
    .replace(/<(u|ins)\b[^>]*>/gi, '<u>')
    .replace(/<\/(u|ins)>/gi, '</u>')
    .replace(/<(s|strike|del)\b[^>]*>/gi, '<s>')
    .replace(/<\/(s|strike|del)>/gi, '</s>');

  // Remove any remaining disallowed tags
  html = html.replace(/<\/?(?!\/?(?:b|i|u|s|code|pre)\b)[a-zA-Z][\w:-]*\b[^>]*>/gi, '');

  html = escapePlainSegments(html);

  let text = html.replace(/\n{3,}/g, '\n\n').trim();
  if (!text && linkButtons.length) {
    text = '🔗';
  }

  return { text, linkButtons };
}

function LABEL_PLACEHOLDER(label: string) {
  // Avoid angle brackets so later strip/escape won't touch the label
  return `§§LABEL§§${label.replace(/§/g, '')}§§ENDLABEL§§`;
}

/**
 * Single-line → <code> (copy-on-tap). Multiline → <pre>.
 * If the monospace text itself is a URL, also create a URL button.
 */
function formatMonospace(
  raw: string,
  pushLink: (url: string, label?: string) => void,
): string {
  const content = raw.trim();
  if (!content) return '';

  if (isValidHttpUrl(content)) {
    pushLink(content, content);
    // Don't also leave the raw URL in body (avoids ugly preview + duplicate).
    // Copyable short label inside <code>:
    return `<code>${escapeTelegramText(content)}</code>`;
  }

  // Detect bare URL inside monospace blob
  const urlMatch = content.match(/https?:\/\/[^\s<]+/i);
  if (urlMatch) {
    pushLink(urlMatch[0], urlMatch[0]);
  }

  const escaped = escapeTelegramText(content);
  if (content.includes('\n')) {
    return `<pre>${escaped}</pre>`;
  }
  return `<code>${escaped}</code>`;
}

/** @deprecated prefer buildTelegramPayload */
export function toTelegramHtml(input: string): string {
  return buildTelegramPayload(input).text;
}

export function linkButtonsMarkup(buttons: TelegramLinkButton[]) {
  if (!buttons.length) return undefined;
  return {
    inline_keyboard: buttons.map((b) => [{ text: b.text, url: b.url }]),
  } as const;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeTelegramText(input: string) {
  return decodeHtmlEntities(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isValidHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function truncateButton(text: string) {
  const t = text.trim();
  if (t.length <= 64) return t;
  return `${t.slice(0, 63)}…`;
}

function escapePlainSegments(html: string) {
  const parts = html.split(/(<\/?(?:b|i|u|s|code|pre)>)/i);
  return parts
    .map((part) => {
      if (/^<\/?(?:b|i|u|s|code|pre)>$/i.test(part)) {
        return part.toLowerCase();
      }
      return part.replace(/&(?!(amp|lt|gt|quot|#39);)/g, '&amp;');
    })
    .join('');
}
