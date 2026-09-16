import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryDir = path.join(__dirname, 'frontend/public/images/gallery');
const dataFile = path.join(__dirname, 'frontend/public/data/gallery.json');

if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });
if (!fs.existsSync(path.dirname(dataFile))) fs.mkdirSync(path.dirname(dataFile), { recursive: true });

async function run() {
    let files = fs.readdirSync(galleryDir).filter(f => f.match(/\.(png|jpe?g|webp)$/i));
    let uniqueFiles = new Set(files);
    
    console.log(`Currently we have ${uniqueFiles.size} unique images.`);
    
    const TARGET = 50;
    
    // AI Generate missing ones using Pollinations API which generates AI images instantly via URL
    if (uniqueFiles.size < TARGET) {
        let needed = TARGET - uniqueFiles.size;
        console.log(`Need ${needed} more images. Generating from AI...`);
        
        const downloadImage = (seed, filename) => new Promise((resolve, reject) => {
            const prompt = encodeURIComponent('Beautiful Indian Navratri Garba festival vibrant dance traditional dress high quality photography');
            const url = `https://image.pollinations.ai/prompt/${prompt}?seed=${seed}&width=800&height=600&nologo=True`;
            const filepath = path.join(galleryDir, filename);
            const file = fs.createWriteStream(filepath);
            
            https.get(url, (res) => {
                if(res.statusCode === 301 || res.statusCode === 302) {
                    https.get(res.headers.location, (res2) => {
                        res2.pipe(file);
                        file.on('finish', () => { file.close(); resolve(filename); });
                    }).on('error', reject);
                } else {
                    res.pipe(file);
                    file.on('finish', () => { file.close(); resolve(filename); });
                }
            }).on('error', reject);
        });

        const promises = [];
        for (let i = 0; i < needed; i++) {
            const seed = Date.now() + i * 1000;
            const filename = `ai_gen_garba_${seed}.jpg`;
            console.log(`Generating AI image: ${filename}`);
            promises.push(downloadImage(seed, filename));
            // Add slight delay to avoid overwhelming the server
            await new Promise(r => setTimeout(r, 200));
        }
        
        await Promise.all(promises);
        console.log(`Downloaded ${needed} AI images successfully.`);
        files = fs.readdirSync(galleryDir).filter(f => f.match(/\.(png|jpe?g|webp)$/i));
    }
    
    // Ensure uniqueness
    const items = [];
    const usedPaths = new Set();
    const categories = ['Dance', 'Devotion', 'Crowd', 'Celebrities'];
    const titles = ['Rhythm of Devotion', 'The Grand Stage', 'SVAR Unity', 'Navratri Nights', 'Golden Garba', 'Festival of Joy', 'Dandiya Raas'];
    
    let id = 1;
    for (const file of files) {
         if (usedPaths.has(file)) continue; // Ensure no repetition
         usedPaths.add(file);
         
         items.push({
             id: id++,
             title: `${titles[Math.floor(Math.random() * titles.length)]} ${id}`,
             src: `/images/gallery/${file}`,
             category: categories[Math.floor(Math.random() * categories.length)]
         });
    }
    
    // Shuffle the items
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    
    fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
    console.log(`Generated gallery.json with ${items.length} strictly unique images.`);
}

run().catch(console.error);
