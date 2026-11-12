const BASE_URL = "https://api.mangadex.org";
const IMAGE_URL = "https://uploads.mangadex.org";

// --- 1. RECHERCHE ---
globalThis.searchResults = async function (query) {
    try {
        const url = `${BASE_URL}/manga?title=${encodeURIComponent(query)}&translatedLanguage[]=fr&limit=20&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;
        const response = await fetchv2(url);
        const json = await response.json();
        
        if (json.data && Array.isArray(json.data)) {
            return json.data.map(item => {
                const title = item.attributes.title.fr || item.attributes.title.en || Object.values(item.attributes.title)[0];
                let coverUrl = "";
                
                const coverRel = item.relationships.find(r => r.type === "cover_art");
                if (coverRel && coverRel.attributes) {
                    coverUrl = `${IMAGE_URL}/covers/${item.id}/${coverRel.attributes.fileName}.256.jpg`;
                }

                return {
                    title: title,
                    href: item.id,
                    image: coverUrl,
                    id: item.id
                };
            });
        }
        return [];
    } catch (e) { return []; }
};

// --- 2. DÉTAILS ---
globalThis.extractDetails = async function (urlOrId) {
    try {
        const id = urlOrId.split('/').pop();
        const response = await fetchv2(`${BASE_URL}/manga/${id}`);
        const json = await response.json();
        const item = json.data;
        
        const title = item.attributes.title.fr || item.attributes.title.en || Object.values(item.attributes.title)[0];
        const desc = item.attributes.description.fr || item.attributes.description.en || "";
        
        return {
            title: title,
            description: desc.replace(/<[^>]+>/g, ''),
            image: "",
            id: id
        };
    } catch (e) { return null; }
};

// --- 3. CHAPITRES ---
globalThis.extractChapters = async function (seriesId) {
    try {
        const id = seriesId.split('/').pop();
        const url = `${BASE_URL}/manga/${id}/feed?translatedLanguage[]=fr&order[chapter]=desc&limit=100`;
        const response = await fetchv2(url);
        const json = await response.json();
        
        if (json.data && Array.isArray(json.data)) {
            return json.data.map(chap => ({
                title: `Chapitre ${chap.attributes.chapter || "?"} - ${chap.attributes.title || ""}`,
                href: chap.id,
                id: chap.id
            }));
        }
        return [];
    } catch (e) { return []; }
};

// --- 4. IMAGES ---
globalThis.extractImages = async function (chapterId) {
    try {
        const id = chapterId.split('/').pop();
        const serverRes = await fetchv2(`${BASE_URL}/at-home/server/${id}`);
        const serverJson = await serverRes.json();
        
        const baseUrl = serverJson.baseUrl;
        const hash = serverJson.chapter.hash;
        const data = serverJson.chapter.data;

        return data.map(filename => `${baseUrl}/data/${hash}/${filename}`);
    } catch (e) { 
        return []; 
    }
};
