/**
 * Helper to clean text for speech synthesis (TTS).
 * Removes markdown syntax, HTML tags, citations, emojis/symbols that may cause speech glitches,
 * and technical keywords.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/`[^`]*`/g, ' ');

  // 2. Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // 3. Remove Markdown links [text](url) -> keep only text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // 4. Remove Markdown images ![alt](url) -> remove completely
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, ' ');

  // 5. Remove citations like [1], [2], [1, 2], [source: 1]
  cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, ' ');
  cleaned = cleaned.replace(/\[[Ss]ource[^\]]*\]/g, ' ');

  // 6. Remove technical labels and parameters
  cleaned = cleaned.replace(/\b(?:RAG|GraphRAG|source_used|domain|similarity|score|rank\s*#?\d+|metadata)\b/gi, ' ');

  // 7. Clean up headers symbols (###, ##, #)
  cleaned = cleaned.replace(/^#+\s+/gm, ' ');

  // 8. Clean up bullet points (- , * , + )
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ' ');

  // 9. Remove formatting symbols (**, *, __, _, ~~, etc.)
  cleaned = cleaned.replace(/[*_~]+/g, ' ');

  // 10. Normalize spaces and line breaks
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}
