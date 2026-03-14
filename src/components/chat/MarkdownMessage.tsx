"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Props = {
  content: string;
};

/**
 * Renders assistant markdown with sanitization (strips script, javascript: URLs,
 * and other dangerous content). Uses rehype-sanitize with default GitHub-style schema.
 * Preserves LLM newlines as line breaks and adds extra vertical spacing.
 */
export function MarkdownMessage({ content }: Props) {
  const withHardBreaks = React.useMemo(
    () => content.replace(/\n/g, "  \n"),
    [content]
  );

  return (
    <div className="prose prose-sm max-w-none font-sans text-zinc-900 leading-relaxed [&_*]:break-words [&_p]:mb-3 [&_p:last-child]:mb-0 [&_br]:block [&_br]:h-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {withHardBreaks}
      </ReactMarkdown>
    </div>
  );
}
