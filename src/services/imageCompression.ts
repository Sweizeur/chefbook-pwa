export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export class ImageCompressionService {
  private static readonly DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    maxSizeKB: 500, // 500KB max
  };

  static async compressImage(
    base64Image: string,
    options: CompressionOptions = {}
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      console.log('🖼️ ImageCompression: Starting compression');
      console.log('🖼️ ImageCompression: Original size:', Math.round(base64Image.length / 1024), 'KB');
      
      // Convert base64 to Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Calculate new dimensions
            const { width, height } = this.calculateDimensions(
              img.width,
              img.height,
              opts.maxWidth,
              opts.maxHeight
            );
            
            console.log('🖼️ ImageCompression: Resizing from', img.width, 'x', img.height, 'to', width, 'x', height);
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different quality levels if image is too large
            let quality = opts.quality;
            let compressedBase64 = this.canvasToBase64(canvas, quality);
            
            // If still too large, reduce quality
            while (compressedBase64.length > opts.maxSizeKB * 1024 && quality > 0.1) {
              quality -= 0.1;
              compressedBase64 = this.canvasToBase64(canvas, quality);
              console.log('🖼️ ImageCompression: Reducing quality to', quality, 'Size:', Math.round(compressedBase64.length / 1024), 'KB');
            }
            
            console.log('🖼️ ImageCompression: Final size:', Math.round(compressedBase64.length / 1024), 'KB');
            console.log('✅ ImageCompression: Compression completed');
            
            resolve(compressedBase64);
          } catch (error) {
            console.error('❌ ImageCompression: Error during compression:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          console.error('❌ ImageCompression: Error loading image');
          reject(new Error('Could not load image'));
        };
        
        img.src = base64Image;
      });
    } catch (error) {
      console.error('❌ ImageCompression: Error in compressImage:', error);
      throw error;
    }
  }

  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    
    // Resize based on the larger dimension
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  private static canvasToBase64(canvas: HTMLCanvasElement, quality: number): string {
    return canvas.toDataURL('image/jpeg', quality);
  }

  static async compressImageFromFile(file: File, options: CompressionOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const compressed = await this.compressImage(base64, options);
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Could not read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  static async getImageSize(base64Image: string): Promise<{ width: number; height: number; sizeKB: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          sizeKB: Math.round(base64Image.length / 1024),
        });
      };
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
      img.src = base64Image;
    });
  }
}
