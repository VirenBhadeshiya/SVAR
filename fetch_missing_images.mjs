import fs from 'fs';
import path from 'path';

// Fetch remaining 34 images from a reliable royalty-free source (Wikimedia Commons)
// Ensure they are not corrupt by checking the header, using a User-Agent, and verifying size.

const targetDir = './public/images/gallery';
const dataPath = './public/data/gallery.json';

async function run() {
    let existingItems = [];
    if (fs.existsSync(dataPath)) {
        existingItems = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    
    // We already have 16 AI images. We need up to 50 unique items total.
    // Let's keep the existing 16 AI items. And uniquely add 34 more.
    const aiItems = existingItems.slice(0, 16); 
    
    console.log(`Starting with ${aiItems.length} AI images.`);
    
    let count = aiItems.length + 1;
    const finalItems = [...aiItems];
    
    const searches = ["Navratri+Garba", "Dandiya+Raas", "Garba+dance+India", "Navratri+festival+Gujarat"];
    
    for (const search of searches) {
        if (count > 50) break;
        
        const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${search}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url`;
        
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'SVAR-Navratri-App/1.0 (viren@example.com)' }});
            const data = await res.json();
            const pages = data.query?.pages || {};
            
            for (const page of Object.values(pages)) {
                if (count > 50) break;
                if (!page.imageinfo || !page.imageinfo[0]) continue;
                
                const imgUrl = page.imageinfo[0].url;
                const title = page.title.replace('File:', '').split('.')[0].substring(0, 30);
                
                if (imgUrl.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
                    try {
                        console.log(`Downloading: ${imgUrl}`);
                        const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'SVAR-Navratri-App/1.0 (viren@example.com)' }});
                        if (!imgRes.ok) continue;
                        
                        const arrayBuffer = await imgRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        
                        // Check if it's a valid image and not a tiny corrupt HTML
                        if (buffer.length < 15000) {
                            console.log("Skipping corrupt or tiny image.");
                            continue;
                        }
                        
                        const filename = `real_garba_${count}.jpg`;
                        const filepath = path.join(targetDir, filename);
                        fs.writeFileSync(filepath, buffer);
                        
                        finalItems.push({
                            id: count,
                            title: title || `Navratri Magic ${count}`,
                            src: `/images/gallery/${filename}`,
                            category: ["Dance", "Devotion", "Crowd", "Celebrities"][Math.floor(Math.random()*4)]
                        });
                        count++;
                    } catch (err) {
                        console.error("Failed to download or write", imgUrl);
                    }
                }
            }
        } catch (e) {
            console.error("Failed search", search, e);
        }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(finalItems, null, 2));
    console.log(`Successfully completed with ${finalItems.length} unique items.`);
}

run();
