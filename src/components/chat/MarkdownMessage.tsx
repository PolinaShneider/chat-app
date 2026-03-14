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
 */
export function MarkdownMessage({ content }: Props) {
  return (
    <div className="prose prose-sm max-w-none font-sans text-zinc-900 [&_*]:break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
