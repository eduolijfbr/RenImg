import { ImageFile } from '../types';

export class ImageScanner {
  private allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.tiff', '.bmp'];

  /**
   * Scans a directory using the File System Access API.
   * This requests real read access to the user's folder.
   */
  public async scanDirectory(): Promise<{ files: ImageFile[], dirHandle: FileSystemDirectoryHandle }> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error("Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.");
    }

    try {
      // Prompt user to select a directory
      const dirHandle = await window.showDirectoryPicker({
        id: 'photon-rename-picker',
        mode: 'readwrite' // Request write access upfront for renaming later
      });

      const files: ImageFile[] = [];

      // Iterate through the directory handle
      // @ts-ignore - TypeScript might not fully know the async iterator depending on lib version
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const fileName = fileHandle.name;
          const lastDotIndex = fileName.lastIndexOf('.');

          if (lastDotIndex === -1) continue;

          const extension = fileName.substring(lastDotIndex).toLowerCase();
          const nameWithoutExt = fileName.substring(0, lastDotIndex);

          if (this.allowedExtensions.includes(extension)) {
            // Get the actual File object to read metadata/preview
            const fileData = await fileHandle.getFile();

            files.push({
              id: Math.random().toString(36).substr(2, 9),
              originalName: nameWithoutExt,
              extension: extension,
              path: fileName, // Relative path inside the handle
              size: fileData.size,
              lastModified: fileData.lastModified,
              fileObject: fileData,
              previewUrl: URL.createObjectURL(fileData),
              handle: fileHandle // Store the handle for renaming later
            });
          }
        }
      }

      // Sort by name by default
      files.sort((a, b) => a.originalName.localeCompare(b.originalName));

      return { files, dirHandle };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return { files: [], dirHandle: null as any };
      }
      throw error;
    }
  }
}
