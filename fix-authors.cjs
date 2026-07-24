const fs = require('fs');
const p = require('path');
let n = 0;
fs.readdirSync('posts').filter(f => f.endsWith('.md')).forEach(f => {
  const fp = p.join('posts', f);
  let s = fs.readFileSync(fp, 'utf8');
  if (s.includes('author: Jeff')) {
    s = s.replace(/author: Jeff/g, 'author: 熵');
    fs.writeFileSync(fp, s);
    n++;
  }
});
console.log('updated md author fields:', n);
