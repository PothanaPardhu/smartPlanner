// js/main.js

let map;
let markers = [];

// Custom Marker Icon for Map Pins
const travelIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [35, 35],
    popupAnchor: [0, -15]
});

/**
 * Initialize Map (Leaflet.js)
 */
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map', {
        scrollWheelZoom: false 
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

/**
 * Main function triggered by "Generate Plan" button
 * Production Update: Redirects to planner.html with URL parameters
 */
async function startPlanning() {
    const cityInput = document.getElementById('citySearch').value;
    const grid = document.getElementById('results-grid');
    
    if (!cityInput) {
        alert("Please enter a destination!");
        return;
    }

    // OPTION A: Redirect to Dedicated Planner Page (Recommended for Production)
    // This sends the user to planner.html?city=Paris
    window.location.href = `planner.html?city=${encodeURIComponent(cityInput)}`;

    /* // OPTION B: Keep results on same page (uncomment if you don't want to redirect)
    
    grid.innerHTML = `
        <div class="col-span-full text-center py-20">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 mb-4"></div>
            <p class="text-indigo-600 font-bold text-xl">Crafting your itinerary for ${cityInput}...</p>
        </div>
    `;

    try {
        await getAmadeusToken();
        const [cityImg, travelData] = await Promise.all([
            getHeroImage(cityInput),
            getCityData(cityInput)
        ]);

        updateMap(travelData.lat, travelData.lon, travelData.pois);
        renderPOI(travelData.pois, cityImg);
        document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Planning Error:", error);
        grid.innerHTML = `<p class="text-red-500 text-center col-span-full">Error fetching data. Check your API keys.</p>`;
    }
    */
}

/**
 * Updates Leaflet Map with Markers
 */
function updateMap(lat, lon, pois) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    map.flyTo([lat, lon], 13, { duration: 2 });

    pois.forEach(poi => {
        const marker = L.marker([poi.geoCode.latitude, poi.geoCode.longitude], { icon: travelIcon })
            .addTo(map)
            .bindPopup(`<b class="text-indigo-600">${poi.name}</b><br>${poi.category}`);
        markers.push(marker);
    });
}

/**
 * Renders POI Cards to the Grid
 */
function renderPOI(pois, imageUrl) {
    const grid = document.getElementById('results-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (pois.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500">No landmarks found nearby.</p>`;
        return;
    }

    pois.forEach(poi => {
        const category = poi.category.toLowerCase().replace(/_/g, ' ');
        const card = `
            <div class="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100">
                <div class="h-48 overflow-hidden relative">
                    <img src="${imageUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="${poi.name}">
                    <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        ${category}
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-poppins font-bold text-slate-800 mb-2 truncate">${poi.name}</h3>
                    <p class="text-slate-500 text-sm mb-6">Discover this amazing ${category} spot in the heart of the city.</p>
                    <button onclick="focusPOI(${poi.geoCode.latitude}, ${poi.geoCode.longitude}, '${poi.name.replace(/'/g, "\\'")}')" 
                        class="w-full py-3 bg-slate-50 text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                        Show on Map
                    </button>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

/**
 * Focuses map on a specific marker
 */
function focusPOI(lat, lon, name) {
    map.flyTo([lat, lon], 16);
    const mapSec = document.getElementById('map-section');
    if (mapSec) mapSec.scrollIntoView({ behavior: 'smooth' });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.classList.add('py-2', 'bg-white/95');
        nav.classList.remove('py-4', 'bg-white/80');
    } else {
        nav.classList.add('py-4', 'bg-white/80');
        nav.classList.remove('py-2', 'bg-white/95');
    }
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', initMap);