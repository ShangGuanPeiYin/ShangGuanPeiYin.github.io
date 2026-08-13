function o(e){const t=e.trim(),n=t.match(/^<ul>\s*<li>([\s\S]*)<\/li>\s*<\/ul>$/i);return((n==null?void 0:n[1])??t).replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi,"")}export{o as n};
