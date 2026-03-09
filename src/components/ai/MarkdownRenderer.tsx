import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight markdown-to-JSX renderer for AI chat messages.
 * Supports: headings, bold, italic, bullet lists, numbered lists, inline code, horizontal rules.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuffer) return;
    if (listBuffer.type === "ul") {
      elements.push(
        <ul key={key++} className="list-disc list-outside pl-5 space-y-1 text-sm text-foreground/90">
          {listBuffer.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key++} className="list-decimal list-outside pl-5 space-y-1 text-sm text-foreground/90">
          {listBuffer.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    }
    listBuffer = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={key++} className="border-border my-2" />);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      const headingClasses: Record<number, string> = {
        1: "text-base font-bold text-foreground mt-3 mb-1.5",
        2: "text-sm font-bold text-foreground mt-3 mb-1",
        3: "text-sm font-semibold text-foreground mt-2 mb-1",
        4: "text-xs font-semibold text-muted-foreground mt-2 mb-1 uppercase tracking-wide",
      };
      elements.push(
        <div key={key++} className={cn("flex items-center gap-2", headingClasses[level] || headingClasses[3])}>
          {text}
        </div>
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[*\-•]\s+(.+)/);
    if (ulMatch) {
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(parseInline(ulMatch[1]));
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(parseInline(olMatch[1]));
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      elements.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-sm text-foreground/90 leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  flushList();

  return <div className={cn("space-y-1", className)}>{elements}</div>;
}

/** Parse inline markdown: **bold**, *italic*, `code`, [links](url) */
function parseInline(text: string): React.ReactNode {
  // Remove leading emoji shortcodes that are just decorative
  const parts: React.ReactNode[] = [];
  // Regex to match bold, italic, code, and links
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic
      parts.push(
        <em key={match.index} className="italic text-foreground/80">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Code
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-primary">
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      // Link
      parts.push(
        <a key={match.index} href={match[9]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {match[8]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
