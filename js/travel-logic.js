// js/travel-logic.js
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
    // 1. Get Lat/Lon from Amadeus (Supports City, Airport, or District)
    const geoUrl = `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(searchQuery)}`;
    const geoRes = await fetch(geoUrl, {
        headers: { "Authorization": `Bearer ${amadeusToken}` }
    });
    const geoData = await geoRes.json();
    
    if (!geoData.data || geoData.data.length === 0) {
        throw new Error("Location not found. Try a broader city name.");
    }
    
    const { latitude, longitude } = geoData.data[0].geoCode;

    // 2. Fetch Real-Time Landmarks from OpenStreetMap (Overpass API)
    // This query looks for 'tourism' spots (museums, monuments, etc.)
    const osmQuery = `
        [out:json];
        node["tourism"](around:5000, ${latitude}, ${longitude});
        out 15;
    `;
    const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`;
    
    try {
        const osmRes = await fetch(osmUrl);
        const osmData = await osmRes.json();

        // Transform OSM data into our card format
        const realPois = osmData.elements.map(item => ({
            name: item.tags.name || "Historic Landmark",
            category: (item.tags.tourism || "Sightseeing").toUpperCase(),
            geoCode: {
                latitude: item.lat,
                longitude: item.lon
            }
        }));

        return {
            lat: latitude,
            lon: longitude,
            pois: realPois.length > 0 ? realPois : []
        };
    } catch (e) {
        console.error("OSM failed, returning empty POIs");
        return { lat: latitude, lon: longitude, pois: [] };
    }
}

async function getHeroImage(query) {
    const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${CONFIG.UNSPLASH_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800';
    const data = await res.json();
    return data.urls.regular;
}