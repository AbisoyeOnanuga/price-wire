export const MAX_TITLE_LENGTH = 200;
export const MAX_CONDITION_DETAIL_LENGTH = 2000;
export const MAX_JSON_BODY_BYTES = 32_768;

function stripControlChars(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export type QuoteInput = {
  title: string;
  condition?: string;
  condition_detail?: string;
};

export function normalizeQuoteInput(body: {
  title?: string;
  condition?: string;
  condition_detail?: string;
}): QuoteInput | { error: string } {
  const title = stripControlChars(body.title?.trim() ?? "");
  if (!title) {
    return { error: "title is required" };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      error: `title must be at most ${MAX_TITLE_LENGTH} characters`,
    };
  }
  const condition_detail = body.condition_detail
    ? stripControlChars(body.condition_detail.trim())
    : undefined;
  if (
    condition_detail &&
    condition_detail.length > MAX_CONDITION_DETAIL_LENGTH
  ) {
    return {
      error: `condition details must be at most ${MAX_CONDITION_DETAIL_LENGTH} characters`,
    };
  }
  return {
    title,
    condition: body.condition,
    condition_detail,
  };
}
