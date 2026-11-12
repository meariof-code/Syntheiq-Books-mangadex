(() => {
  "use strict";
  const BASE_URL = "https://api.mangadex.org";
  const IMAGE_URL = "https://uploads.mangadex.org";
  const HEADERS = { "Accept": "application/json" };
  
  globalThis.SynthetiqModule = {
    async searchResults(query) {
      try {
        const url = `${BASE_URL}/manga?title=${encodeURIComponent(query)}&translatedLanguage[]=fr&limit=20&includes[]=cover_art`;
        const response = await fetchv2(url, HEADERS);
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) return { items: [], hasMore: false };
        
        const items = json.data.map(item => {
          const title = item.attributes.title.fr || item.attributes.title.en || Object.values(item.attributes.title)[0];
          let coverUrl = "";
          const coverRel = item.relationships.find(r => r.type === "cover_art");
          if (coverRel && coverRel.attributes) {
            coverUrl = `${IMAGE_URL}/covers/${item.id}/${coverRel.attributes.fileName}.256.jpg`;
          }
          return { id: item.id, title: title, href: item.id, image: coverUrl };
        });
        return { items, hasMore: false };
      } catch (e) { return { items: [], hasMore: false }; }
    },
    async extractDetails(itemID) {
      try {
        const id = itemID.split('/').pop();
        const response = await fetchv2(`${BASE_URL}/manga/${id}`, HEADERS);
        const json = await response.json();
        const item = json.data;
        return { id: id, title: item.attributes.title.fr || item.attributes.title.en || Object.values(item.attributes.title)[0], description: (item.attributes.description.fr || "").replace(/<[^>]+>/g, ''), image: "" };
      } catch (e) { return null; }
    },
    async extractChapters(itemID) {
      try {
        const id = itemID.split('/').pop();
        const url = `${BASE_URL}/manga/${id}/feed?translatedLanguage[]=fr&order[chapter]=desc&limit=100`;
        const response = await fetchv2(url, HEADERS);
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) return [];
        return json.data.map(chap => ({ id: chap.id, title: `Chapitre ${chap.attributes.chapter || "?"}`, href: chap.id }));
      } catch (e) { return []; }
    },
    async extractImages(chapterID) {
      try {
        const id = chapterID.split('/').pop();
        const serverRes = await fetchv2(`${BASE_URL}/at-home/server/${id}`, HEADERS);
        const serverJson = await serverRes.json();
        return serverJson.chapter.data.map(filename => `${serverJson.baseUrl}/data/${serverJson.chapter.hash}/${filename}`);
      } catch (e) { return []; }
    }
  };
})();
