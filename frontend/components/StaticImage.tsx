import React, { useMemo } from 'react';

interface StaticImageProps {
  alt: string;
  className?: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

const STATIC_IMAGES = [
  "/images/garba1.png",
  "/images/garba2.png",
  "/images/garba3.png",
  "/images/garba4.png",
  "/images/garba5.png"
];

export const StaticImage: React.FC<StaticImageProps> = ({ 
  alt, 
  className = "",
  aspectRatio = "16:9"
}) => {
  const randomImage = useMemo(() => {
    return STATIC_IMAGES[Math.floor(Math.random() * STATIC_IMAGES.length)];
  }, []);

  // Fallback to picsum if images are not found in public folder
  // In a real production app, we would ensure these images exist.
  // For this environment, we'll use a reliable fallback.
  const [w, h] = aspectRatio.split(':').map(Number);
  const width = 1200;
  const height = Math.round((width * h) / w);
  const fallbackUrl = `https://picsum.photos/seed/${btoa(alt).substring(0, 10)}/${width}/${height}`;

  return (
    <img 
      src={randomImage} 
      alt={alt} 
      className={`object-cover ${className}`}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackUrl;
      }}
    />
  );
};
