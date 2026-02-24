const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/a.alarcon/Desktop/Cursor projects/kakebo/kakebo/src/content/blog';

const dates = {
    'kakebo-online-guia-completa': '2026-02-24',
    'kakebo-online-complete-guide': '2026-02-24',
    'kakebo-online-gratis': '2026-02-10',
    'metodo-kakebo-guia-definitiva': '2026-02-13',
    'plantilla-kakebo-excel': '2026-01-27',
    'eliminar-gastos-hormiga': '2026-01-20',
    'alternativas-a-app-bancarias': '2026-01-13',
    'kakebo-vs-ynab': '2025-12-30',
    'metodo-kakebo-para-autonomos': '2025-12-23',
    'libro-kakebo-pdf': '2025-12-16',
    'regla-30-dias': '2025-12-09',
    'kakebo-sueldo-minimo': '2025-12-02',
    'ahorro-pareja': '2025-11-25',
    'peligros-apps-ahorro-automatico': '2025-11-18'
};

const duplicateH2_es = '## ¿Quieres aplicar el método Kakebo sin esfuerzo?';
const duplicateH2_en = '## Do you want to apply the Kakebo method effortlessly?';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Find slug base
    const slugBase = file.replace('.es.mdx', '').replace('.en.mdx', '');
    const targetDate = dates[slugBase];

    if (targetDate) {
        // Update datePublished
        content = content.replace(/datePublished:\s*['"]?[0-9-]{10}['"]?/, `datePublished: '${targetDate}'`);
        // Update dateModified
        content = content.replace(/dateModified:\s*['"]?[0-9-]{10}['"]?/, `dateModified: '2026-02-24'`);
    }

    // Remove duplicate H2
    content = content.replace(duplicateH2_es, '');
    content = content.replace(duplicateH2_en, '');

    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file + ' targetDate: ' + targetDate);
});
