/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  CloudUpload,
  X,
  FileText,
  Loader2,
  Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UploadCompleteResult {
  fileName: string;
  name: string;
  fileUrl: string;
}

interface FileUploadProps {
  onUploadComplete: (result: UploadCompleteResult) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  maxSize?: number;
  accept?: string;
  className?: string;
  multiple?: boolean;
  maxFiles?: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxSize = 16,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp',
  className,
  multiple = false,
  maxFiles = 5,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: File[]) => {
    if (disabled) return;

    // Check if adding these files would exceed the max files limit
    if (uploadingFiles.length + files.length > maxFiles) {
      onUploadError(`Cannot upload more than ${maxFiles} files at once`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      onUploadError(`${oversizedFiles.length} file(s) exceed ${maxSize}MB limit`);
      return;
    }

    // Create uploading file objects
    const newUploadingFiles = files.map(file => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substring(7),
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files sequentially to avoid overwhelming the server
    uploadFilesSequentially(newUploadingFiles);
  };

  const uploadFilesSequentially = async (filesToUpload: UploadingFile[]) => {
    for (const uploadingFile of filesToUpload) {
      await uploadFile(uploadingFile);
    }
  };

  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadingFile.file);

      // Create progress tracking interval
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(file => 
          file.id === uploadingFile.id 
            ? { ...file, progress: Math.min(file.progress + 10, 90) }
            : file
        ));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      // Set progress to 100%
      setUploadingFiles(prev => prev.map(file => 
        file.id === uploadingFile.id 
          ? { ...file, progress: 100 }
          : file
      ));

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      if (result.success && result.fileName && result.fileUrl) {
        // Call completion handler for this file
        onUploadComplete({
          fileName: result.fileName,
          name: result.originalName || uploadingFile.file.name,
          fileUrl: result.fileUrl,
        });

        // Remove this file from uploading list after a short delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(file => file.id !== uploadingFile.id));
        }, 1000);
      } else {
        throw new Error(result.error || 'Upload failed: Invalid server response');
      }
    } catch (error) {
      // Remove failed upload from list
      setUploadingFiles(prev => prev.filter(file => file.id !== uploadingFile.id));
      onUploadError(`Failed to upload ${uploadingFile.file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const filesToUpload = multiple ? files.slice(0, maxFiles) : [files[0]];
      handleFileSelect(filesToUpload);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const filesToUpload = multiple ? files.slice(0, maxFiles) : [files[0]];
      handleFileSelect(filesToUpload);
    }
  };

  const cancelUpload = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const isUploading = uploadingFiles.length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
          "hover:border-primary hover:bg-accent/50",
          isDragOver && !disabled && "border-primary bg-accent/50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          "border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <CloudUpload className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              {multiple 
                ? `Drop up to ${maxFiles} files here or click to browse`
                : 'Drop files here or click to browse'
              }
            </h3>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {maxSize}MB
              {multiple && ` • Up to ${maxFiles} files`}
            </p>
          </div>
        </div>
      </div>

      {/* Uploading Files Progress */}
      {isUploading && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              Uploading {uploadingFiles.length} file{uploadingFiles.length !== 1 ? 's' : ''}...
            </h4>
          </div>
          
          <div className="space-y-3">
            {uploadingFiles.map((uploadingFile) => (
              <Card key={uploadingFile.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate pr-2">
                          {uploadingFile.file.name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {uploadingFile.progress}%
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={uploadingFile.progress} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelUpload(uploadingFile.id)}
                    className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Updated UploadedFileDisplay component
interface UploadedFileDisplayProps {
  fileName: string;
  name: string;
  fileUrl: string | null;
  onRemove: () => void;
  disabled?: boolean;
}

export function UploadedFileDisplay({
  name,
  fileUrl,
  onRemove,
  disabled = false,
}: UploadedFileDisplayProps) {
  const fileExtension = name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExtension);

  const renderPreview = () => {
    if (isImage && fileUrl) {
      return (
        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          <img 
            src={fileUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    if (isVideo && fileUrl) {
      return (
        <div className="w-12 h-12 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
          <Video className="h-6 w-6 text-primary" />
        </div>
      );
    }
    
    return (
      <div className="w-12 h-12 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
        <FileText className="h-6 w-6 text-primary" />
      </div>
    );
  };

  return (
    <Card className="p-3 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {renderPreview()}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
              {name}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Successfully uploaded
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="h-8 w-8 p-0 flex-shrink-0 text-green-600 hover:text-red-600 hover:bg-red-50 dark:text-green-400 dark:hover:text-red-400 dark:hover:bg-red-950"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}