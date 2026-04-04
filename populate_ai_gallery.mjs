import fs from 'fs';
import path from 'path';

const generatedDir = 'C:/Users/viren/.gemini/antigravity/brain/c519ae9d-8357-43fa-85bf-5e3d70acaecd/';
const targetDir = './public/images/gallery';
const dataPath = './public/data/gallery.json';

// Ensure dir exists
if (!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir, { recursive: true });
}

// Clear old files
const oldFiles = fs.readdirSync(targetDir);
for (const file of oldFiles) {
    fs.unlinkSync(path.join(targetDir, file));
}

// Find our 16 AI images
const allFiles = fs.readdirSync(generatedDir);
const aiImages = allFiles.filter(f => f.endsWith('.png') && (f.startsWith('ai_garba_') || f.startsWith('navratri_garba_')));

console.log(`Found ${aiImages.length} AI images.`);

// Copy them to target
const uploadedPaths = [];
let imgCounter = 1;
for (const file of aiImages) {
    const destName = `ai_img_${imgCounter}.png`;
    fs.copyFileSync(path.join(generatedDir, file), path.join(targetDir, destName));
    uploadedPaths.push(`/images/gallery/${destName}`);
    imgCounter++;
}

// Create 50 gallery items
const categories = ['Dance', 'Devotion', 'Crowd', 'Celebrities'];
const titles = [
    'Rhythm of Devotion', 'The Grand Stage', 'SVAR Unity', 'Navratri Nights',
    'Golden Garba', 'Festival of Joy', 'Dandiya Raas', 'Cultural Elegance',
    'Divine Presence', 'Community Heritage'
];

const galleryItems = [];
for (let i = 1; i <= 50; i++) {
    const randomImg = uploadedPaths[(i - 1) % uploadedPaths.length];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)] + ` ${i}`;
    
    galleryItems.push({
        id: i,
        title: randomTitle,
        src: randomImg,
        category: randomCat
    });
}

// Shuffle the array nicely
for (let i = galleryItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [galleryItems[i], galleryItems[j]] = [galleryItems[j], galleryItems[i]];
}

fs.writeFileSync(dataPath, JSON.stringify(galleryItems, null, 2));
console.log('Successfully created gallery.json with 50 working AI images.');
