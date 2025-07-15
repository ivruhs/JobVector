export function normalizeTextSimple(text) {
  if (!text || typeof text !== "string") return "";

  return (
    text
      // Remove emojis and extended pictographic symbols
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")

      // Remove private-use area characters (used by weird fonts like Wingdings)
      .replace(/[\uE000-\uF8FF]/g, "") // BMP Private Use Area
      .replace(/[\u{F0000}-\u{FFFFD}]/gu, "") // Supplementary Private Use Area-A
      .replace(/[\u{100000}-\u{10FFFD}]/gu, "") // Supplementary Private Use Area-B

      // Remove undefined control characters
      .replace(/[\x00-\x1F\x7F-\x9F\uFEFF]/g, "")

      // Fix encoding issues
      .replace(/â€™/g, "'")
      .replace(/â€œ|â€/g, '"')
      .replace(/â€¢/g, "•")
      .replace(/â€“|â€”/g, "-")

      // Replace non-breaking spaces with normal spaces
      .replace(/\u00A0|\u2007|\u202F/g, " ")

      // Fix excessive punctuation
      .replace(/\.{4,}/g, "...")
      .replace(/-{4,}/g, "---")

      // Clean whitespace
      .replace(/[ \t]+$/gm, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")

      // Trim lines and document
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim()
  );
}
