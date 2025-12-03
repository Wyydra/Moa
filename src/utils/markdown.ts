import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

/**
 * Convert Markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return '';
  }
  
  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error('Markdown parse error:', error);
    return markdown; // Return original if parsing fails
  }
}

/**
 * Strip all formatting from Markdown to get plain text
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/__(.+?)__/g, '$1') // Remove underline
    .replace(/~~(.+?)~~/g, '$1') // Remove strikethrough
    .replace(/^\s*[-*+]\s+/gm, '') // Remove unordered lists
    .replace(/^\s*\d+\.\s+/gm, '') // Remove ordered lists
    .trim();
}

/**
 * Check if content is Markdown (vs HTML)
 */
export function isMarkdown(content: string): boolean {
  // Simple heuristic: if it contains HTML tags, it's HTML
  // Otherwise assume Markdown
  const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
  return !htmlTagPattern.test(content);
}

/**
 * Insert Markdown syntax around selected text
 */
export function wrapWithMarkdown(
  text: string,
  start: number,
  end: number,
  prefix: string,
  suffix?: string
): { text: string; selectionStart: number; selectionEnd: number } {
  const actualSuffix = suffix || prefix;
  const before = text.substring(0, start);
  const selected = text.substring(start, end);
  const after = text.substring(end);
  
  const newText = before + prefix + selected + actualSuffix + after;
  
  return {
    text: newText,
    selectionStart: start + prefix.length,
    selectionEnd: end + prefix.length,
  };
}

/**
 * Insert Markdown prefix at line start
 */
export function insertLinePrefix(
  text: string,
  cursorPosition: number,
  prefix: string
): { text: string; selectionStart: number } {
  const lines = text.split('\n');
  let currentPos = 0;
  let lineIndex = 0;
  
  // Find which line the cursor is on
  for (let i = 0; i < lines.length; i++) {
    if (currentPos + lines[i].length >= cursorPosition) {
      lineIndex = i;
      break;
    }
    currentPos += lines[i].length + 1; // +1 for \n
  }
  
  // Insert prefix at line start
  lines[lineIndex] = prefix + lines[lineIndex];
  
  return {
    text: lines.join('\n'),
    selectionStart: cursorPosition + prefix.length,
  };
}
