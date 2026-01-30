'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Loader2,
  ImageIcon,
  GripVertical,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';

interface QuestionImage {
  id: string;
  filename: string;
  filepath: string;
  caption: string | null;
  sortOrder: number;
}

interface ImageUploadProps {
  questionId: string;
  images: QuestionImage[];
  onImagesChange?: () => void;
}

export function ImageUpload({
  questionId,
  images,
  onImagesChange,
}: ImageUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);
      setIsUploading(true);

      const uploadedCount = { success: 0, failed: 0 };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(
            `/api/questions/${questionId}/images`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Upload failed');
          }

          uploadedCount.success++;
        } catch (err) {
          uploadedCount.failed++;
          console.error('Upload error:', err);
        }
      }

      setIsUploading(false);
      setUploadProgress(null);

      if (uploadedCount.failed > 0) {
        setError(
          `${uploadedCount.failed} file(s) failed to upload. Check file size (max 5MB) and type (JPEG, PNG, GIF, WebP).`
        );
      }

      if (uploadedCount.success > 0) {
        router.refresh();
        onImagesChange?.();
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [questionId, router, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;

    setDeletingId(imageId);

    try {
      const response = await fetch(
        `/api/questions/${questionId}/images/${imageId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      router.refresh();
      onImagesChange?.();
    } catch (err) {
      setError('Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditCaption = (image: QuestionImage) => {
    setEditingCaption(image.id);
    setCaptionValue(image.caption || '');
  };

  const handleSaveCaption = async (imageId: string) => {
    try {
      const response = await fetch(
        `/api/questions/${questionId}/images/${imageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption: captionValue }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update caption');
      }

      setEditingCaption(null);
      router.refresh();
      onImagesChange?.();
    } catch (err) {
      setError('Failed to update caption');
    }
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleImageDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    // Reorder images
    const currentOrder = images.map((img) => img.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    // Update server
    fetch(`/api/questions/${questionId}/images`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageIds: newOrder }),
    }).then(() => {
      router.refresh();
      onImagesChange?.();
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="image-upload"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">{uploadProgress}</p>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drop images here or{' '}
              <span className="text-blue-600 hover:underline">browse</span>
            </p>
            <p className="text-xs text-gray-400">
              JPEG, PNG, GIF, WebP up to 5MB
            </p>
          </label>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Attached Images ({images.length})
          </p>
          <div className="grid gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleDragStart(e, image.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleImageDragOver(e, image.id)}
                className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${
                  draggedId === image.id ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={`/api${image.filepath}`}
                    alt={image.caption || image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.filename}
                  </p>
                  {editingCaption === image.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={captionValue}
                        onChange={(e) => setCaptionValue(e.target.value)}
                        placeholder="Add caption..."
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveCaption(image.id);
                          } else if (e.key === 'Escape') {
                            setEditingCaption(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSaveCaption(image.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingCaption(null)}
                        className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 truncate">
                      {image.caption || 'No caption'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditCaption(image)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit caption"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={deletingId === image.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete image"
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !isUploading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          No images attached yet
        </div>
      )}
    </div>
  );
}
