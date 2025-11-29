import { ImageFile, ProcessedFile, RenameConfig, FileStatus } from '../types';

export class ImageRenamer {
  
  /**
   * Generates a preview of the renaming operation based on the current config.
   */
  public generatePreview(files: ImageFile[], config: RenameConfig): ProcessedFile[] {
    const result: ProcessedFile[] = [];
    let counter = config.startNumber;

    // To detect duplicates in the *target* list
    const usedNames = new Set<string>();

    for (const file of files) {
      const newName = this.applyPattern(file, config, counter);
      const fullNewName = `${newName}${file.extension}`;

      let status = FileStatus.PENDING;
      let errorMessage = undefined;

      // Simple conflict detection logic
      if (usedNames.has(fullNewName.toLowerCase())) {
        if (!config.overwrite) {
           // Auto-resolve conflict if not overwrite
           status = FileStatus.ERROR;
           errorMessage = "Conflict: Filename already exists in destination";
        }
      }

      usedNames.add(fullNewName.toLowerCase());

      result.push({
        ...file,
        newName: newName,
        status: status,
        errorMessage
      });

      counter++;
    }

    return result;
  }

  /**
   * Parses the pattern string and replaces tokens.
   */
  private applyPattern(file: ImageFile, config: RenameConfig, index: number): string {
    let name = config.pattern;

    // Replace {name} - Original Name
    name = name.replace(/{name}/g, file.originalName);

    // Replace {date} - YYYY-MM-DD
    const dateStr = new Date(file.lastModified).toISOString().split('T')[0];
    name = name.replace(/{date}/g, dateStr);

    // Replace {num} or {num:ddd}
    name = name.replace(/{num(?::(\d+))?}/g, (match, paddingStr) => {
      let numStr = index.toString();
      if (paddingStr) {
        const padLen = paddingStr.length;
        numStr = numStr.padStart(padLen, '0');
      }
      return numStr;
    });

    // Apply Prefix and Suffix
    name = `${config.prefix}${name}${config.suffix}`;

    return name;
  }

  /**
   * Executes the REAL rename operation on the file system.
   */
  public async executeRename(file: ProcessedFile, dirHandle: FileSystemDirectoryHandle): Promise<void> {
    if (!file.handle || !dirHandle) {
      throw new Error("Missing file system permissions or handles.");
    }

    const fullNewName = file.newName + file.extension;
    const fullOldName = file.originalName + file.extension;

    // Skip if name hasn't changed
    if (fullNewName === fullOldName) {
      return; 
    }

    try {
      // Strategy: Since "rename" isn't a simple command in all implementations yet,
      // and .move() is experimental, the robust web way is:
      // 1. Create new file handle
      // 2. Copy content
      // 3. Delete old file

      // @ts-ignore - Check for experimental 'move' support (Chrome 111+)
      if (file.handle.move) {
        // @ts-ignore
        await file.handle.move(fullNewName);
      } else {
        // Fallback: Copy and Delete
        
        // 1. Get/Create new file
        const newFileHandle = await dirHandle.getFileHandle(fullNewName, { create: true });
        
        // 2. Write data
        const oldFile = await file.handle.getFile();
        const writable = await newFileHandle.createWritable();
        await writable.write(oldFile);
        await writable.close();

        // 3. Remove old file
        await dirHandle.removeEntry(fullOldName);
      }
      
    } catch (err) {
      console.error(`Failed to rename ${file.originalName}`, err);
      throw err;
    }
  }
}
