import fs from 'fs';
import path from 'path';

const distGalleryDir = path.resolve('./dist/images/gallery');
const publicGalleryDir = path.resolve('./public/images/gallery');
const galleryJsonPath = path.resolve('./public/data/gallery.json');

// Ensure public gallery dir exists
if (!fs.existsSync(publicGalleryDir)) {
  fs.mkdirSync(publicGalleryDir, { recursive: true });
}

// Read all files from dist/images/gallery
const files = fs.readdirSync(distGalleryDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.jpeg'));

// Copy files to public/images/gallery to ensure dev server can see them
files.forEach(file => {
  const srcNode = path.join(distGalleryDir, file);
  const destNode = path.join(publicGalleryDir, file);
  // Copy if not exists
  if (!fs.existsSync(destNode)) {
    fs.copyFileSync(srcNode, destNode);
  }
});

const categories = ['Dance', 'Devotion', 'Celebrities', 'Crowd'];
const galleryData = files.map((file, idx) => {
  return {
    id: idx + 1,
    title: `SVAR Image ${idx + 1}`,
    src: `/images/gallery/${file}`,
    category: categories[idx % categories.length]
  };
});

fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));

console.log(`Successfully generated gallery.json with ${files.length} unique images.`);
