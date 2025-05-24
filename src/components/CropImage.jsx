export default function getCroppedImg(imageSrc, croppedAreaPixels) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            canvas.toBlob(blob => {
                if (!blob) return reject(new Error('Failed to crop image.'));
                const url = URL.createObjectURL(blob);
                resolve(url);
            }, 'image/jpeg');
        };

        image.onerror = (err) => {
            console.error("Failed to load image for cropping", err);
            reject(new Error("Image load failed (bad URL or CORS)."));
        };
    });
}
