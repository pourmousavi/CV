'use client';

import { useState, useEffect, useCallback } from 'react';
import katex from 'katex';
import { Eye, Code, Maximize2, Minimize2 } from 'lucide-react';

interface LaTeXEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minRows?: number;
  helpText?: string;
}

export function LaTeXEditor({
  value,
  onChange,
  placeholder = 'Enter LaTeX content...',
  label,
  required = false,
  minRows = 6,
  helpText,
}: LaTeXEditorProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');

  // Render LaTeX with KaTeX
  const renderLatex = useCallback((text: string) => {
    if (!text.trim()) {
      setRenderedHtml('<span class="text-gray-400 italic">Preview will appear here...</span>');
      return;
    }

    try {
      // Process the text to handle both inline and display math
      let html = text;

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

      // Convert newlines to <br> for non-math text
      html = html.replace(/\n/g, '<br>');

      setRenderedHtml(html);
    } catch (error) {
      setRenderedHtml(`<span class="text-red-500">Render error: ${error}</span>`);
    }
  }, []);

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      renderLatex(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, renderLatex]);

  return (
    <div className={`${isExpanded ? 'fixed inset-4 z-50 bg-white rounded-lg shadow-2xl flex flex-col' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`p-1.5 rounded text-sm transition-colors ${
              showPreview
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title={isExpanded ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Editor and Preview */}
      <div className={`flex gap-4 ${isExpanded ? 'flex-1 overflow-hidden' : ''} ${showPreview ? 'flex-col md:flex-row' : ''}`}>
        {/* Editor */}
        <div className={`${showPreview ? 'md:w-1/2' : 'w-full'} ${isExpanded ? 'h-full' : ''}`}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            rows={isExpanded ? undefined : minRows}
            className={`w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm resize-none ${
              isExpanded ? 'h-full' : ''
            }`}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className={`${isExpanded ? 'md:w-1/2 h-full overflow-auto' : 'md:w-1/2'}`}>
            <div
              className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${
                isExpanded ? 'h-full overflow-auto' : 'min-h-[150px]'
              }`}
            >
              <div className="text-xs text-gray-500 mb-2 font-medium">Preview</div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !isExpanded && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}

      {/* LaTeX tips */}
      {!isExpanded && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">Tips:</span> Use{' '}
          <code className="bg-gray-100 px-1 rounded">$...$</code> for inline math,{' '}
          <code className="bg-gray-100 px-1 rounded">$$...$$</code> for display math
        </div>
      )}

      {/* Fullscreen backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
