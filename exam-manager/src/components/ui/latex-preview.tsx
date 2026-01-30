'use client';

import { useEffect, useState } from 'react';
import katex from 'katex';

interface LaTeXPreviewProps {
  content: string;
  className?: string;
}

export function LaTeXPreview({ content, className = '' }: LaTeXPreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    if (!content?.trim()) {
      setRenderedHtml('');
      return;
    }

    try {
      let html = content;

      // Replace display math: $$ ... $$ or \[ ... \]
      html = html.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g, (match, p1, p2) => {
        const latex = p1 || p2;
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            trust: true,
          });
        } catch {
          return `<span class="text-red-500">[Error: ${match}]</span>`;
        }
      });

      // Replace inline math: $ ... $ or \( ... \)
      html = html.replace(/\$([^$\n]+?)\$|\\\(([^)]+?)\\\)/g, (match, p1, p2) => {
        const latex = p1 || p2;
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            trust: true,
          });
        } catch {
          return `<span class="text-red-500">[Error: ${match}]</span>`;
        }
      });

      // Convert newlines to <br>
      html = html.replace(/\n/g, '<br>');

      setRenderedHtml(html);
    } catch (error) {
      setRenderedHtml(`<span class="text-red-500">Render error</span>`);
    }
  }, [content]);

  if (!content?.trim()) {
    return null;
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
