
import React from 'react';
import { ProcessedFile, FileStatus } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { FileImage, AlertCircle, CheckCircle, ArrowRight, CircleDashed } from 'lucide-react';

interface FileListProps {
  files: ProcessedFile[];
  t: any;
}

const FileList: React.FC<FileListProps> = ({ files, t }) => {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
        <FileImage size={64} className="mb-4 opacity-20" />
        <p className="text-lg font-light text-slate-600 dark:text-slate-400">{t.noFilesTitle}</p>
        <p className="text-sm text-slate-500">{t.noFilesSub}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-lg transition-colors duration-300">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div className="col-span-1">{t.headerIndex}</div>
        <div className="col-span-1">{t.headerPreview}</div>
        <div className="col-span-4">{t.headerOriginal}</div>
        <div className="col-span-1 text-center">→</div>
        <div className="col-span-4">{t.headerNew}</div>
        <div className="col-span-1 text-right">{t.headerSize}</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {files.map((file, index) => (
          <div 
            key={file.id} 
            className={`grid grid-cols-12 gap-4 px-6 py-3 items-center border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${
              file.status === FileStatus.ERROR ? 'bg-red-50 dark:bg-red-500/10' : ''
            } ${file.status === FileStatus.SUCCESS ? 'bg-green-50 dark:bg-green-500/10' : ''}`}
          >
            {/* Index */}
            <div className="col-span-1 text-slate-400 dark:text-slate-500 font-mono text-sm">
              {(index + 1).toString().padStart(3, '0')}
            </div>

            {/* Thumbnail */}
            <div className="col-span-1">
              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt="thumb" className="w-full h-full object-cover" />
                ) : (
                  <FileImage className="w-full h-full p-2 text-slate-400 dark:text-slate-600" />
                )}
              </div>
            </div>

            {/* Original Name */}
            <div className="col-span-4 truncate text-slate-700 dark:text-slate-300 text-sm" title={file.originalName}>
              {file.originalName}
              <span className="text-slate-400 dark:text-slate-500 ml-1">{file.extension}</span>
              <div className="text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">{formatDate(file.lastModified)}</div>
            </div>

            {/* Arrow / Status Icon */}
            <div className="col-span-1 flex justify-center text-slate-400 dark:text-slate-500">
              {file.status === FileStatus.PENDING && <ArrowRight size={16} />}
              {file.status === FileStatus.SUCCESS && <CheckCircle size={16} className="text-green-500" />}
              {file.status === FileStatus.ERROR && <AlertCircle size={16} className="text-red-500" />}
              {file.status === FileStatus.SKIPPED && <CircleDashed size={16} className="text-yellow-500" />}
            </div>

            {/* New Name */}
            <div className="col-span-4 truncate text-sm">
              {file.status === FileStatus.ERROR ? (
                <span className="text-red-500 dark:text-red-400 italic text-xs">{file.errorMessage}</span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {file.newName}
                  <span className="text-blue-400/70 dark:text-blue-600/70">{file.extension}</span>
                </span>
              )}
            </div>

            {/* Size */}
            <div className="col-span-1 text-right text-slate-400 dark:text-slate-500 text-xs font-mono">
              {formatBytes(file.size, 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
