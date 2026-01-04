// js/travel-logic.js
// At the top of travel-logic.js
if (!CONFIG.AMADEUS_ID) {
    console.error("API Keys are missing! Check your config settings.");
}
let amadeusToken = '';


async function getAmadeusToken() {
    const url = "https://test.api.amadeus.com/v1/security/oauth2/token";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=client_credentials&client_id=${CONFIG.AMADEUS_ID}&client_secret=${CONFIG.AMADEUS_SECRET}`
    });
    const data = await response.json();
    amadeusToken = data.access_token;
}

async function getCityData(searchQuery) {
    const geoUrl = `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(searchQuery)}`;
    const geoRes = await fetch(geoUrl, { headers: { "Authorization": `Bearer ${amadeusToken}` } });
    const geoData = await geoRes.json();
    
    if (!geoData.data || geoData.data.length === 0) throw new Error("Location not found.");
    const { latitude, longitude } = geoData.data[0].geoCode;

    // PRODUCTION-LEVEL QUERY: Fetches landmarks, historic sites, and attractions
    const osmQuery = `
        [out:json][timeout:25];
        (
          nwr["tourism"~"museum|monument|viewpoint|attraction|theme_park"](around:10000, ${latitude}, ${longitude});
          nwr["historic"~"castle|ruins|monument|fort"](around:10000, ${latitude}, ${longitude});
        );
        out center 60; 
    `;
    const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`;
    
    try {
        const osmRes = await fetch(osmUrl);
        const contentType = osmRes.headers.get("content-type");
        if (!osmRes.ok || !contentType || !contentType.includes("application/json")) {
            return { lat: latitude, lon: longitude, pois: [] };
        }

        const osmData = await osmRes.json();
        const realPois = (osmData.elements || []).map(item => {
            const tags = item.tags || {};
            const lat = item.lat || (item.center ? item.center.lat : latitude);
            const lon = item.lon || (item.center ? item.center.lon : longitude);
            
            const cat = (tags.tourism || tags.historic || "Sightseeing").toUpperCase();
            // PRODUCTION FEATURE: Assign realistic entrance fee estimates
            let fee = 10;
            if (cat.includes("MUSEUM")) fee = 15;
            else if (cat.includes("CASTLE") || cat.includes("FORT")) fee = 20;
            else if (cat.includes("VIEWPOINT")) fee = 5;

            return {
                name: tags.name || "Historical Monument",
                category: cat,
                entranceFee: fee,
                geoCode: { latitude: lat, longitude: lon }
            };
        });

        return { lat: latitude, lon: longitude, pois: realPois };
    } catch (e) {
        console.error("OSM fetch failed:", e);
        return { lat: latitude, lon: longitude, pois: [] };
    }
}

async function getRealTimeWeather(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.OPENWEATHER_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

// js/travel-logic.js

// ... (Existing Amadeus and Weather code above) ...

/**
 * Fetches a high-quality landscape image of the destination city from Unsplash.
 */
async function getDestinationImage(city) {
    try {
        // Optimize query for travel landscapes
        const query = encodeURIComponent(`${city} travel landmark landscape`);
        const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${CONFIG.UNSPLASH_ACCESS_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Unsplash image fetch failed");
        
        const data = await response.json();
        
        // Return image URL and required photographer attribution
        return {
            url: data.urls.regular,
            photographer: data.user.name,
            profile: data.user.links.html,
            unsplashLink: data.links.html
        };
    } catch (error) {
        console.error("Unsplash Error:", error);
        // High-quality fallback travel image
        return {
            url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
            photographer: "Unsplash",
            profile: "https://unsplash.com",
            unsplashLink: "https://unsplash.com"
        };
    }
}