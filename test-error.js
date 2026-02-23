fetch('http://localhost:3000/es/blog/alternativas-a-app-bancarias')
    .then(res => res.text())
    .then(html => {
        // Find the Next.js '__NEXT_DATA__' script or error 
        if (html.includes('500 Internal Server Error')) {
            console.log("Found standard 500 page.");
        }
        const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
        if (match) {
            const data = JSON.parse(match[1]);
            if (data.err) {
                console.log("Error from NEXT DATA:", data.err);
            } else {
                console.log("No error found in NEXT_DATA. Page might be fine.");
            }
        } else {
            // It might be the dev overlay HTML
            console.log("HTML response (first 2000 chars):", html.substring(0, 2000));
        }
    })
    .catch(err => console.error("Fetch error:", err));
