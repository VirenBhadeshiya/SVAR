const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = './public/images/gallery';
const dataPath = './public/data/gallery.json';

function httpsGet(urlOptions) {
    return new Promise((resolve, reject) => {
        https.get(urlOptions, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
          if (res.statusCode === 301 || res.statusCode === 302) {
              return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
          }
          return reject(new Error('Failed status: ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', err => fs.unlink(dest, () => reject(err)));
    }).on('error', reject);
  });
}

async function run() {
    let existingItems = [];
    if (fs.existsSync(dataPath)) {
        existingItems = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    
    // Keep 16 AI ones
    const aiItems = existingItems.filter(item => item.src && item.src.includes('ai_img_')); 
    console.log(`Starting with ${aiItems.length} AI images.`);
    
    let count = aiItems.length + 1;
    const finalItems = [...aiItems];
    
    const searches = ["Navratri+Garba", "Garba+dance+India", "Dandiya+Raas"];
    
    for (const search of searches) {
        if (count > 50) break;
        
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${search}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url`;
        
        try {
            console.log("Searching: " + search);
            const data = await httpsGet({
                hostname: 'commons.wikimedia.org',
                path: `/w/api.php?action=query&format=json&generator=search&gsrsearch=${search}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url`,
                headers: { 'User-Agent': 'SVAR-App/1.0' }
            });
            
            const pages = data.query ? data.query.pages : {};
            
            for (const key of Object.keys(pages)) {
                if (count > 50) break;
                const page = pages[key];
                if (!page.imageinfo || !page.imageinfo[0]) continue;
                
                let imgUrl = page.imageinfo[0].url;
                const title = page.title.replace('File:', '').split('.')[0].substring(0, 30);
                
                if (imgUrl.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
                    if (imgUrl.startsWith('http:')) imgUrl = imgUrl.replace('http:', 'https:');
                    
                    const filename = `real_garba_${count}.jpg`;
                    const filepath = path.join(targetDir, filename);
                    
                    try {
                        await downloadImage(imgUrl, filepath);
                        const stats = fs.statSync(filepath);
                        if (stats.size < 15000) {
                            fs.unlinkSync(filepath);
                            console.log(`Skipped size ${stats.size}: ${imgUrl}`);
                            continue;
                        }
                        
                        finalItems.push({
                            id: count,
                            title: title || `Navratri Magic ${count}`,
                            src: `/images/gallery/${filename}`,
                            category: ["Dance", "Devotion", "Crowd", "Celebrities"][Math.floor(Math.random()*4)]
                        });
                        console.log(`Downloaded ${count}: ${imgUrl}`);
                        count++;
                    } catch (err) {
                        console.error(`Error downloading ${imgUrl}: ${err.message}`);
                    }
                }
            }
        } catch (e) {
            console.error("Search error:", e.message);
        }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(finalItems, null, 2));
    console.log(`Done. Saved ${finalItems.length} unique non-repeating images.`);
}

run();
