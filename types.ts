export enum FileStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  SKIPPED = 'SKIPPED',
}

export interface ImageFile {
  id: string;
  originalName: string;
  extension: string;
  path: string; // Virtual path for web demo
  size: number;
  lastModified: number;
  previewUrl?: string;
  fileObject: File;
  handle?: FileSystemFileHandle; // Added for real file system access
}

export interface RenameConfig {
  pattern: string;
  startNumber: number;
  recursive: boolean;
  dryRun: boolean;
  overwrite: boolean;
  prefix: string;
  suffix: string;
}

export interface ProcessedFile extends ImageFile {
  newName: string;
  status: FileStatus;
  errorMessage?: string;
}

export interface ScanResult {
  files: ImageFile[];
  totalSize: number;
}

// Stats for the visualization
export interface ExtensionStat {
  name: string;
  count: number;
  size: number;
}

// Browser Native File System Types (Polyfill definitions if not present in env)
declare global {
  interface Window {
    showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
  }
}
