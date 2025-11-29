/**
 * ImageResizer Service
 * Handles image resizing using Canvas API
 */

export class ImageResizer {

    /**
     * Resize an image file to the specified width while maintaining aspect ratio
     * @param file - Original image file
     * @param targetWidth - Target width in pixels
     * @param quality - JPEG quality (0-100)
     * @returns Resized image as Blob
     */
    public async resizeImage(
        file: File,
        targetWidth: number,
        quality: number = 90
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        // Calculate proportional height
                        const aspectRatio = img.height / img.width;
                        const targetHeight = Math.round(targetWidth * aspectRatio);

                        // Create canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;

                        // Draw resized image
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Could not get canvas context'));
                            return;
                        }

                        // Use high quality image smoothing
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                        // Convert to blob
                        const mimeType = this.getMimeType(file.type);
                        const qualityValue = quality / 100;

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(blob);
                                } else {
                                    reject(new Error('Failed to create blob from canvas'));
                                }
                            },
                            mimeType,
                            qualityValue
                        );
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                if (e.target?.result) {
                    img.src = e.target.result as string;
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Get appropriate MIME type for output
     */
    private getMimeType(originalType: string): string {
        // Support common image formats
        if (originalType === 'image/png') {
            return 'image/png';
        } else if (originalType === 'image/webp') {
            return 'image/webp';
        } else {
            // Default to JPEG for all other formats (including jpg, jpeg, etc.)
            return 'image/jpeg';
        }
    }

    /**
     * Check if image needs resizing
     */
    public async shouldResize(file: File, targetWidth: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    resolve(img.width > targetWidth);
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                if (e.target?.result) {
                    img.src = e.target.result as string;
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }
}
