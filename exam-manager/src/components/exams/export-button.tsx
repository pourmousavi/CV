'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  examId: string;
  examTitle: string;
}

export function ExportButton({ examId, examTitle }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (includeSolutions: boolean) => {
    setIsExporting(true);

    try {
      const url = `/api/exams/${examId}/export${includeSolutions ? '?solutions=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to export exam');
      }

      // Get the filename from content-disposition header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${examTitle.replace(/\s+/g, '_')}.tex`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (error) {
      alert('Failed to export exam');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Download className="h-4 w-4" />
        Export LaTeX
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isExporting && setIsOpen(false)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Export to LaTeX
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Download a complete LaTeX file ready for Overleaf or any LaTeX editor.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleExport(false)}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                ) : (
                  <FileText className="h-8 w-8 text-blue-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">Exam Only</p>
                  <p className="text-sm text-gray-500">
                    Questions without solutions
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleExport(true)}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                ) : (
                  <FileText className="h-8 w-8 text-green-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">Exam + Solutions</p>
                  <p className="text-sm text-gray-500">
                    Includes answer key and worked solutions
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
              className="mt-4 w-full px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
