import React, { useState, useRef, useCallback, useEffect, DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FileStatus = "idle" | "dragging" | "uploading" | "error";

interface FileError {
  message: string;
  code: string;
}

interface FileUploadProps {
  onUploadSuccess?: (file: File) => void;
  onUploadError?: (error: FileError) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  currentFile?: File | null;
  onFileRemove?: () => void;
  uploadDelay?: number;
  className?: string;
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FILE_SIZES = ["Bytes", "KB", "MB", "GB"] as const;

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unit = FILE_SIZES[i] || FILE_SIZES[FILE_SIZES.length - 1];
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
};

const UploadIllustration = () => (
  <div className="relative h-16 w-16 mx-auto">
    <svg
      aria-label="Upload illustration"
      className="h-full w-full"
      fill="none"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="stroke-primary/30"
        cx="50"
        cy="50"
        r="45"
        strokeDasharray="4 4"
        strokeWidth="2"
      />
      <path
        className="fill-primary/10 stroke-primary"
        d="M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
        strokeWidth="2"
      />
      <g className="translate-y-2 transform">
        <line
          className="stroke-primary"
          strokeLinecap="round"
          strokeWidth="2"
          x1="50"
          x2="50"
          y1="45"
          y2="60"
        />
        <polyline
          className="stroke-primary"
          fill="none"
          points="42,52 50,45 58,52"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </g>
    </svg>
  </div>
);

export default function FileUpload({
  onUploadSuccess = () => {},
  onUploadError = () => {},
  acceptedFileTypes = ["image/*"],
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  currentFile = null,
  uploadDelay = 1200,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(currentFile);
  const [status, setStatus] = useState<FileStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<FileError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;
      setError(null);

      if (selectedFile.size > maxFileSize) {
        const err = { message: `File exceeds ${formatBytes(maxFileSize)}`, code: "FILE_TOO_LARGE" };
        setError(err);
        onUploadError(err);
        return;
      }

      setFile(selectedFile);
      setStatus("uploading");
      setProgress(0);

      let currentProgress = 0;
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);

      uploadIntervalRef.current = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 100) {
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
          setProgress(100);
          setStatus("idle");
          onUploadSuccess(selectedFile);
        } else {
          setProgress(currentProgress);
        }
      }, uploadDelay / 10);
    },
    [maxFileSize, onUploadError, onUploadSuccess, uploadDelay]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("dragging");
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("idle");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("idle");
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="glass-card premium-border rounded-2xl p-6 text-center relative overflow-hidden">
        <input
          ref={fileInputRef}
          accept={acceptedFileTypes.join(",")}
          className="hidden"
          type="file"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />

        <AnimatePresence mode="wait">
          {status === "uploading" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-mono text-sm text-foreground/80 font-medium">Processing {file?.name}</p>
              <p className="font-mono text-xs text-primary font-bold">{progress}%</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="space-y-4"
            >
              <UploadIllustration />
              <div className="space-y-1">
                <h4 className="font-medium text-base text-foreground">
                  Drag and drop image or text file
                </h4>
                <p className="text-xs text-foreground/50 font-light">
                  Supports PNG, JPG, WEBP, TXT up to {formatBytes(maxFileSize)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-mono text-xs font-semibold hover:opacity-90 transition-all shadow-md"
              >
                <span>Browse Local File</span>
                <UploadCloud className="w-4 h-4" />
              </button>

              {error && (
                <p className="text-xs text-destructive font-mono font-medium">{error.message}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
