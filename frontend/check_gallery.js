const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/gallery.json', 'utf8'));
const counts = {};
const uniqueImages = [];
data.forEach(item => {
    counts[item.src] = (counts[item.src] || 0) + 1;
});
console.log("Total entries:", data.length);
console.log("Unique src:", Object.keys(counts).length);
const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
console.log("Duplicates:", duplicates);
