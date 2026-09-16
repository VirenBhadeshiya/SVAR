import fs from 'fs';
import path from 'path';

const distGalleryDir = path.resolve('./dist/images/gallery');
const publicGalleryDir = path.resolve('./public/images/gallery');
const galleryJsonPath = path.resolve('./public/data/gallery.json');

// Get all files from public gallery
const allFiles = fs.existsSync(publicGalleryDir) ? fs.readdirSync(publicGalleryDir) : [];

// Identify invalid files (those starting with ai_gen_garba_)
const invalidFiles = allFiles.filter(f => f.startsWith('ai_gen_garba_'));

// Delete invalid files from both dist and public
invalidFiles.forEach(file => {
    try {
        if (fs.existsSync(path.join(publicGalleryDir, file))) {
            fs.unlinkSync(path.join(publicGalleryDir, file));
        }
        if (fs.existsSync(path.join(distGalleryDir, file))) {
            fs.unlinkSync(path.join(distGalleryDir, file));
        }
    } catch (e) {
        console.warn(`Could not delete ${file}`);
    }
});

console.log(`Deleted ${invalidFiles.length} invalid files.`);

// Get valid images
const validFiles = fs.readdirSync(publicGalleryDir).filter(f => 
    !f.startsWith('ai_gen_garba_') && 
    (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
);

console.log(`Found ${validFiles.length} valid images:`, validFiles);

// Generate 50 entries by repeating the 21 images
const categories = ['Dance', 'Devotion', 'Celebrities', 'Crowd'];
const galleryData = [];

for (let i = 0; i < 50; i++) {
    // Cycle through the valid files
    const validFile = validFiles[i % validFiles.length];
    
    galleryData.push({
        id: i + 1,
        title: `SVAR Moments ${i + 1}`,
        src: `/images/gallery/${validFile}`,
        category: categories[i % categories.length]
    });
}

// Write to public/data/gallery.json
if (fs.existsSync(path.dirname(galleryJsonPath))) {
    fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryData, null, 2));
    console.log(`Successfully mapped ${validFiles.length} valid images into 50 gallery slots.`);
} else {
    console.error("gallery.json directory does not exist!");
}
