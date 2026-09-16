
/**
 * Compresses and resizes an image file to a manageable size for LocalStorage and API usage.
 * Target: Max 600px width/height, 0.5 JPEG quality to prevent storage quota exceedance.
 */
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Optimization: If file is already smaller than 200KB, skip heavy compression but still check dimensions
        if (file.size < 200 * 1024 && file.type === 'image/jpeg') {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error("File read error"));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // CRITICAL UPDATE: Reduced dimensions to prevent LocalStorage crash
                    const MAX_WIDTH = 600;
                    const MAX_HEIGHT = 600;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error("Canvas context unavailable"));
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG at 0.5 quality (Aggressive compression for stability)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                    resolve(dataUrl);
                } catch (e) {
                    reject(new Error("Image compression processing failed"));
                }
            };
            img.onerror = () => reject(new Error("Invalid image file"));
        };
        reader.onerror = () => reject(new Error("File read failed"));
    });
};
