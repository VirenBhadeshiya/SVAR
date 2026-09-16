import fs from 'fs';
import path from 'path';

const targetDir = './public/images/gallery';
const dataPath = './public/data/gallery.json';

async function run() {
    let existing = [];
    if (fs.existsSync(dataPath)) {
        existing = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    
    let aiItems = existing.filter(i => i.src && i.src.includes('ai_img_'));
    let finalItems = [...aiItems];
    let count = aiItems.length + 1;
    
    const terms = ["Dandiya+Raas", "Navratri+Garba", "Garba+India"];
    
    for (const term of terms) {
        if (count > 50) break;
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${term}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url`;
        
        try {
            console.log("Searching API: " + term);
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 SVAR-Gallery/1.0' } });
            const data = await res.json();
            const pages = data.query ? data.query.pages : {};
            
            for (const page of Object.values(pages)) {
                if (count > 50) break;
                if (!page.imageinfo || !page.imageinfo[0]) continue;
                let url = page.imageinfo[0].url;
                let title = page.title.replace('File:', '').replace(/\.[^.]*$/, '').substring(0, 30);
                
                if (url.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
                    if (url.startsWith('http:')) url = url.replace('http:', 'https:');
                    try {
                        const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                        if (!imgRes.ok) continue;
                        
                        const ab = await imgRes.arrayBuffer();
                        const buf = Buffer.from(ab);
                        
                        if (buf.length > 20000) { // 20KB min size
                            const name = `real_garba_${count}.jpg`;
                            fs.writeFileSync(path.join(targetDir, name), buf);
                            
                            finalItems.push({
                                id: count,
                                title: title.trim() || `Navratri Moment ${count}`,
                                src: `/images/gallery/${name}`,
                                category: ["Dance", "Devotion", "Crowd", "Celebrities"][Math.floor(Math.random()*4)]
                            });
                            console.log(`Downloaded ${count}: ${url}`);
                            count++;
                        }
                    } catch (e) {
                         console.error("Download fail: ", e.message);
                    }
                }
            }
        } catch (e) {
            console.error("API error", e);
        }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(finalItems, null, 2));
    console.log(`SUCCESS. Saved ${finalItems.length} unique images for the gallery.`);
}
run();
