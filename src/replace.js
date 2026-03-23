const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'components'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Remove Loader2 from lucide-react, add WavyLoader import if Loader2 was found
    if (content.includes('Loader2') && !content.includes('WavyLoader')) {
        // Find lucide import
        const lucideSrc = content.match(/import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/);
        if (lucideSrc && lucideSrc[1].includes('Loader2')) {
            let inner = lucideSrc[1].replace(/\bLoader2\b\s*,?/, '').trim();
            // clean up trailing comma
            if (inner.endsWith(',')) inner = inner.slice(0, -1);
            let newImport = `import { ${inner} } from "lucide-react"`;
            newImport = newImport.replace(/\{\s+\}/, '{}'); // if empty
            
            content = content.replace(lucideSrc[0], newImport + '\nimport { WavyLoader } from "@/components/ui/wavy-loader"');
            
            // replace instances
            content = content.replace(/<Loader2/g, '<WavyLoader');
            changed = true;
        } else if (content.includes('Loader2')) { // sometimes it's imported from somewhere else or used
            content = content.replace(/<Loader2/g, '<WavyLoader');
            if(!content.includes('WavyLoader')) {
                 content = `import { WavyLoader } from "@/components/ui/wavy-loader"\n` + content;
            }
            changed = true;
        }
    }
    
    // Also replace Loader if it's imported
    if (content.includes('Loader') && !content.includes('WavyLoader') && file !== path.join(__dirname, 'components', 'ui', 'wavy-loader.tsx') && file !== path.join(__dirname, 'components', 'page-loader.tsx')) {
        const lucideSrc = content.match(/import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/);
        if (lucideSrc && (lucideSrc[1].includes('Loader,') || lucideSrc[1].match(/\bLoader\b/))) {
            let inner = lucideSrc[1].replace(/\bLoader\b\s*,?/, '').trim();
            if (inner.endsWith(',')) inner = inner.slice(0, -1);
            let newImport = `import { ${inner} } from "lucide-react"`;
            newImport = newImport.replace(/\{\s+\}/, '{}');
            
            content = content.replace(lucideSrc[0], newImport + '\nimport { WavyLoader } from "@/components/ui/wavy-loader"');
            content = content.replace(/<Loader /g, '<WavyLoader ');
            content = content.replace(/<Loader\n/g, '<WavyLoader\n');
            content = content.replace(/<Loader\>/g, '<WavyLoader>');
            changed = true;
        }
    }

    // clean up empty lucide-react imports
    content = content.replace(/import\s+\{\s*\}\s+from\s+["']lucide-react["'];?\n/g, '');

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Updated", file);
    }
});
