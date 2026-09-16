const fs = require('fs');
const path = require('path');

const targetDir = './public/images/gallery';
const dataPath = './public/data/gallery.json';

async function run() {
    let existingItems = [];
    if (fs.existsSync(dataPath)) {
        existingItems = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    
    // Select the pristine 16 AI ones
    const aiItems = existingItems.filter(item => item.src && item.src.includes('ai_img_')); 
    let count = aiItems.length + 1; // Start at 17
    const finalItems = [...aiItems];
    console.log(`Starting with ${aiItems.length} AI images.`);
    
    const searches = ["Garba+dance+India", "Navratri+Garba", "Dandiya+Raas"];
    const headers = { 'User-Agent': 'SVAR-Navratri-App/1.0 (test@example.com)' };
    
    for (const search of searches) {
        if (count > 50) break;
        
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${search}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url`;
        
        try {
            console.log(`Searching API for: ${search}`);
            const res = await fetch(apiUrl, { headers });
            const data = await res.json();
            const pages = data.query ? data.query.pages : {};
            
            for (const key of Object.keys(pages)) {
                if (count > 50) break;
                const page = pages[key];
                if (!page.imageinfo || !page.imageinfo[0]) continue;
                
                let imgUrl = page.imageinfo[0].url;
                const title = page.title.replace('File:', '').split('.')[0].substring(0, 30);
                
                if (imgUrl.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
                    if (imgUrl.startsWith('http:')) imgUrl = imgUrl.replace('http:', 'https:');
                    
                    try {
                        const imgRes = await fetch(imgUrl, { headers });
                        if (!imgRes.ok) continue;
                        
                        const arrayBuffer = await imgRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        
                        // Enforce quality - min 15KB size prevents icons/thumbnails
                        if (buffer.length > 15000) {
                            const filename = `real_garba_${count}.jpg`;
                            const filepath = path.join(targetDir, filename);
                            fs.writeFileSync(filepath, buffer);
                            
                            finalItems.push({
                                id: count,
                                title: title.trim() || `Navratri Magic ${count}`,
                                src: `/images/gallery/${filename}`,
                                category: ["Dance", "Devotion", "Crowd", "Celebrities"][Math.floor(Math.random()*4)]
                            });
                            console.log(`Downloaded ${count}: ${imgUrl}`);
                            count++;
                        }
                    } catch (err) {
                        console.error(`Error downloading ${imgUrl}: ${err.message}`);
                    }
                }
            }
        } catch (e) {
            console.error("Search API Failed:", e.message);
        }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(finalItems, null, 2));
    console.log(`Done. Saved ${finalItems.length} unique images for the gallery.`);
}

run().catch(err => console.error("Global Error:", err));
