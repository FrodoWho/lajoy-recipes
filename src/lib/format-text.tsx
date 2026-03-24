import React from "react";

/**
 * Parse **bold** and __underline__ markdown syntax into React nodes.
 */
export function formatRichText(text: string): React.ReactNode {
  if (!text) return text;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const regex = /(\*\*(.+?)\*\*|__(.+?)__)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(
        <strong key={key++} className="font-bold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // __underline__
      parts.push(
        <span key={key++} className="underline">
          {match[3]}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  remaining; // unused, just for clarity
  return parts.length > 0 ? <>{parts}</> : text;
}

/**
 * Check if a string is a section header (starts with "## ").
 */
export function isSectionHeader(text: string): boolean {
  return text.startsWith("## ");
}

/**
 * Get the display text of a section header (strip "## " prefix).
 */
export function getSectionTitle(text: string): string {
  return text.slice(3);
}
