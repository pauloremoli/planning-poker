export interface TextSegment {
  type: "text" | "link";
  value: string;
}

const URL_PATTERN = /https?:\/\/[^\s]+/g;
// Trailing characters that are almost always sentence/bracket punctuation
// rather than part of the URL (e.g. "see http://example.com." or "(http://x.com)").
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

/**
 * Splits free text into plain-text and link segments so callers can render
 * http(s) URLs as clickable links without touching the surrounding text.
 * Trims common trailing punctuation off a matched URL so it isn't swallowed
 * into the link (e.g. a period ending a sentence, or a closing paren).
 */
export function splitLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  URL_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_PATTERN.exec(text))) {
    const start = match.index;
    let url = match[0];
    let end = start + url.length;

    const trailing = url.match(TRAILING_PUNCTUATION);
    if (trailing) {
      url = url.slice(0, url.length - trailing[0].length);
      end -= trailing[0].length;
    }

    if (start > lastIndex) segments.push({ type: "text", value: text.slice(lastIndex, start) });
    segments.push({ type: "link", value: url });
    lastIndex = end;
  }

  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });
  return segments;
}
