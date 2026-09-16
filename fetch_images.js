const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = './public/images/gallery';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

async function fetchImages() {
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=Navratri+Garba&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url";
  
  console.log("Fetching image list from Wikimedia Commons...");
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query?.pages || {};
  
  let count = 1;
  const items = [];
  
  const entries = Object.values(pages);
  
  for (const page of entries) {
    if (page.imageinfo && page.imageinfo[0]) {
      const imgUrl = page.imageinfo[0].url;
      const title = page.title.replace('File:', '').split('.')[0].substring(0, 30);
      
      if (imgUrl.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        console.log(`Downloading ${count}: ${imgUrl}`);
        try {
          const imgRes = await fetch(imgUrl);
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const filename = `gallery_${count}.jpg`;
          const filepath = path.join(dir, filename);
          fs.writeFileSync(filepath, buffer);
          
          items.push({
            id: count,
            title: title || `Navratri Moment ${count}`,
            src: `/images/gallery/${filename}`,
            category: "All"
          });
          count++;
          if (count > 50) break;
        } catch (e) {
          console.error(`Failed to download ${imgUrl}: ${e.message}`);
        }
      }
    }
  }

  // If we need more images
  if (count <= 50) {
    const url2 = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=Dandiya&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url";
    const res2 = await fetch(url2);
    const data2 = await res2.json();
    const pages2 = data2.query?.pages || {};
    for (const page of Object.values(pages2)) {
      if (page.imageinfo && page.imageinfo[0]) {
        const imgUrl = page.imageinfo[0].url;
        const title = page.title.replace('File:', '').split('.')[0].substring(0, 30);
        
        if (imgUrl.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
          console.log(`Downloading ${count}: ${imgUrl}`);
          try {
            const imgRes = await fetch(imgUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const filename = `gallery_${count}.jpg`;
            const filepath = path.join(dir, filename);
            fs.writeFileSync(filepath, buffer);
            
            items.push({
              id: count,
              title: title || `Navratri Moment ${count}`,
              src: `/images/gallery/${filename}`,
              category: "All"
            });
            count++;
            if (count > 50) break;
          } catch (e) {
            console.error(`Failed to download ${imgUrl}: ${e.message}`);
          }
        }
      }
    }
  }

  fs.writeFileSync('./public/data/gallery.json', JSON.stringify(items, null, 2));
  console.log(`Successfully downloaded ${count - 1} images and saved JSON.`);
}

fetchImages();
