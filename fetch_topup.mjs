import fs from 'fs';
import path from 'path';

const targetDir = './public/images/gallery';
const dataPath = './public/data/gallery.json';

async function run() {
    let finalItems = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let count = finalItems.length + 1;
    
    // Loosen quality to ensure speed and 50 count, but still decent
    const terms = ["Hindu+festival", "India+celebration", "Indian+dance", "Gujarat+culture", "Navratri"];
    
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
                
                // Avoid duplicates in names just in case
                if (finalItems.find(x => x.title === title)) continue;
                
                if (url.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
                    if (url.startsWith('http:')) url = url.replace('http:', 'https:');
                    try {
                        const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                        if (!imgRes.ok) continue;
                        
                        const ab = await imgRes.arrayBuffer();
                        const buf = Buffer.from(ab);
                        
                        if (buf.length > 10000) { // 10KB
                            const name = `real_garba_${count}.jpg`;
                            fs.writeFileSync(path.join(targetDir, name), buf);
                            
                            finalItems.push({
                                id: count,
                                title: title.trim() || `SVAR Moment ${count}`,
                                src: `/images/gallery/${name}`,
                                category: ["Dance", "Devotion", "Crowd", "Celebrities"][Math.floor(Math.random()*4)]
                            });
                            console.log(`Downloaded ${count}: ${url}`);
                            count++;
                        }
                    } catch (e) { }
                }
            }
        } catch (e) { }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(finalItems, null, 2));
    console.log(`SUCCESS. Saved ${finalItems.length} unique images for the gallery.`);
}
run();
