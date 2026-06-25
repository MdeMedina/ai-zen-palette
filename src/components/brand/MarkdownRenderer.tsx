import React from "react";

// Renders inline formatting: bold, italic, inline code
function renderInline(text: string): React.ReactNode {
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < text.length) {
    // Inline code
    if (text[i] === "`") {
      const closing = text.indexOf("`", i + 1);
      if (closing !== -1) {
        const codeText = text.slice(i + 1, closing);
        result.push(
          <code
            key={`code-${i}`}
            className="font-mono text-[13px] bg-foreground/5 px-1.5 py-0.5 rounded text-[var(--accent)] font-medium select-all border border-border/10"
          >
            {codeText}
          </code>,
        );
        i = closing + 1;
        continue;
      }
    }

    // Bold
    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      const delimiter = text.startsWith("**", i) ? "**" : "__";
      const closing = text.indexOf(delimiter, i + 2);
      if (closing !== -1) {
        const boldText = text.slice(i + 2, closing);
        result.push(
          <strong key={`bold-${i}`} className="font-bold text-foreground">
            {renderInline(boldText)}
          </strong>,
        );
        i = closing + 2;
        continue;
      }
    }

    // Italic
    if (text[i] === "*" || text[i] === "_") {
      const delimiter = text[i];
      const closing = text.indexOf(delimiter, i + 1);
      if (closing !== -1) {
        const italicText = text.slice(i + 1, closing);
        result.push(
          <em key={`italic-${i}`} className="italic">
            {renderInline(italicText)}
          </em>,
        );
        i = closing + 1;
        continue;
      }
    }

    // Find next delimiter
    let nextDelim = text.length;
    const delims = ["`", "**", "__", "*", "_"];
    for (const d of delims) {
      const idx = text.indexOf(d, i);
      if (idx !== -1 && idx < nextDelim) {
        nextDelim = idx;
      }
    }

    const plain = text.slice(i, nextDelim);
    if (plain) {
      result.push(plain);
    }
    i = nextDelim;
  }

  return <>{result}</>;
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // First, parse code blocks
  const blocks: { type: "code" | "text"; lines: string[]; lang?: string }[] = [];
  const rawLines = content.split("\n");

  let inCodeBlock = false;
  let currentCodeLines: string[] = [];
  let currentCodeLang = "";
  let currentTextLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        blocks.push({ type: "code", lines: currentCodeLines, lang: currentCodeLang });
        currentCodeLines = [];
        currentCodeLang = "";
        inCodeBlock = false;
      } else {
        // Start of code block
        if (currentTextLines.length > 0) {
          blocks.push({ type: "text", lines: currentTextLines });
          currentTextLines = [];
        }
        currentCodeLang = trimmed.slice(3).trim();
        inCodeBlock = true;
      }
    } else {
      if (inCodeBlock) {
        currentCodeLines.push(line);
      } else {
        currentTextLines.push(line);
      }
    }
  }

  // Push remainder
  if (inCodeBlock && currentCodeLines.length > 0) {
    blocks.push({ type: "code", lines: currentCodeLines, lang: currentCodeLang });
  } else if (currentTextLines.length > 0) {
    blocks.push({ type: "text", lines: currentTextLines });
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        if (block.type === "code") {
          const codeString = block.lines.join("\n");
          return (
            <div
              key={`code-block-${bIdx}`}
              className="my-3 font-mono text-[13px] bg-foreground/[0.03] border border-border/40 p-4 rounded overflow-x-auto relative group"
            >
              {block.lang && (
                <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider text-foreground/45 select-none font-mono">
                  {block.lang}
                </span>
              )}
              <pre className="m-0 whitespace-pre">
                <code className="text-foreground/90 font-mono">{codeString}</code>
              </pre>
            </div>
          );
        }

        // Process text lines
        const elements: React.ReactNode[] = [];
        let listItems: string[] = [];
        let listType: "ul" | "ol" | null = null;

        const flushList = (key: string) => {
          if (!listType || listItems.length === 0) return null;
          const Tag = listType;
          const listClass =
            listType === "ul"
              ? "list-disc pl-5 space-y-1.5 my-2"
              : "list-decimal pl-5 space-y-1.5 my-2";
          const items = [...listItems];
          listItems = [];
          listType = null;
          return (
            <Tag key={key} className={listClass}>
              {items.map((item, idx) => (
                <li key={idx} className="text-foreground/90 leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </Tag>
          );
        };

        let lineIdx = 0;
        while (lineIdx < block.lines.length) {
          const line = block.lines[lineIdx];
          const trimmed = line.trim();

          if (trimmed === "") {
            if (listType) {
              elements.push(flushList(`list-${lineIdx}`));
            }
            lineIdx++;
            continue;
          }

          // Headers
          const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
          if (headerMatch) {
            if (listType) {
              elements.push(flushList(`list-${lineIdx}`));
            }
            const level = headerMatch[1].length;
            const headingText = headerMatch[2];
            const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

            let headingClass = "font-sans font-bold text-foreground ";
            if (level === 1)
              headingClass += "text-lg tracking-wide border-b border-border/40 pb-1 mt-4 mb-2";
            else if (level === 2) headingClass += "text-base mt-4 mb-2";
            else if (level === 3) headingClass += "text-sm mt-3 mb-1";
            else headingClass += "text-xs mt-2 mb-1";

            elements.push(
              <HeadingTag key={`h-${lineIdx}`} className={headingClass}>
                {renderInline(headingText)}
              </HeadingTag>,
            );
            lineIdx++;
            continue;
          }

          // Bullet list items
          const bulletMatch = line.match(/^[*+-]\s+(.+)$/);
          if (bulletMatch) {
            if (listType && listType !== "ul") {
              elements.push(flushList(`list-${lineIdx}`));
            }
            listType = "ul";
            listItems.push(bulletMatch[1]);
            lineIdx++;
            continue;
          }

          // Numbered list items
          const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
          if (numberedMatch) {
            if (listType && listType !== "ol") {
              elements.push(flushList(`list-${lineIdx}`));
            }
            listType = "ol";
            listItems.push(numberedMatch[2]);
            lineIdx++;
            continue;
          }

          // Blockquotes
          if (trimmed.startsWith(">")) {
            if (listType) {
              elements.push(flushList(`list-${lineIdx}`));
            }
            const quoteLines = [trimmed.slice(1).trim()];
            lineIdx++;
            while (lineIdx < block.lines.length) {
              const nextLine = block.lines[lineIdx];
              const nextTrimmed = nextLine.trim();
              if (nextTrimmed.startsWith(">")) {
                quoteLines.push(nextTrimmed.slice(1).trim());
                lineIdx++;
              } else {
                break;
              }
            }
            elements.push(
              <blockquote
                key={`quote-${lineIdx}`}
                className="border-l-2 border-border/85 pl-4 py-1 my-3 text-foreground/75 italic bg-foreground/[0.01]"
              >
                {quoteLines.map((ql, qIdx) => (
                  <p key={qIdx} className="leading-relaxed">
                    {renderInline(ql)}
                  </p>
                ))}
              </blockquote>,
            );
            continue;
          }

          // Normal line
          if (listType) {
            elements.push(flushList(`list-${lineIdx}`));
          }

          // Read ahead to group paragraphs
          const paragraphLines = [line];
          lineIdx++;
          while (lineIdx < block.lines.length) {
            const nextLine = block.lines[lineIdx];
            const nextTrimmed = nextLine.trim();
            if (
              nextTrimmed === "" ||
              nextLine.match(/^(#{1,6})\s+/) ||
              nextLine.match(/^[*+-]\s+/) ||
              nextLine.match(/^(\d+)\.\s+/) ||
              nextTrimmed.startsWith(">")
            ) {
              break;
            }
            paragraphLines.push(nextLine);
            lineIdx++;
          }

          elements.push(
            <p
              key={`p-${lineIdx}`}
              className="leading-relaxed text-foreground/90 font-sans my-1.5 whitespace-pre-line"
            >
              {renderInline(paragraphLines.join("\n"))}
            </p>,
          );
        }

        if (listType) {
          elements.push(flushList(`list-end-${bIdx}`));
        }

        return (
          <div key={`text-block-${bIdx}`} className="space-y-1">
            {elements}
          </div>
        );
      })}
    </div>
  );
}
