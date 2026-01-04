// js/planner-logic.js

let plannerMap;
let itineraryMarkers = [];

// js/planner-logic.js
// js/planner-logic.js

async function initPlanner() {
    // 1. Setup Map (Make sure this matches your main.js style)
    plannerMap = L.map('map', { zoomControl: false }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(plannerMap);

    // 2. GET THE CITY FROM THE URL
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city'); // <--- DEFINING CITY HERE

    // 3. Check if city exists in URL, otherwise fallback
    if (!city) {
        console.error("No city provided in URL");
        document.getElementById('itinerary-list').innerHTML = "<p>Please search for a city on the home page.</p>";
        return;
    }

    document.getElementById('dest-name').innerText = `Trip to ${city}`;

    try {
        await getAmadeusToken();
        // Now 'city' is defined and safe to use
        const data = await getCityData(city);
        
        renderItinerary(data.pois);
        updatePlannerMap(data.lat, data.lon, data.pois);
    } catch (err) {
        console.error("Detailed Error:", err);
    }
}

function renderItinerary(pois) {
    const list = document.getElementById('itinerary-list');
    list.innerHTML = '';

    pois.forEach((poi, index) => {
        const item = document.createElement('div');
        item.className = "group p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer";
        item.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    ${index + 1}
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${poi.name}</h4>
                    <p class="text-xs text-slate-500 uppercase">${poi.category.replace(/_/g, ' ')}</p>
                </div>
            </div>
        `;
        item.onclick = () => {
            plannerMap.flyTo([poi.geoCode.latitude, poi.geoCode.longitude], 16);
        };
        list.appendChild(item);
    });
}

function updatePlannerMap(lat, lon, pois) {
    plannerMap.flyTo([lat, lon], 13);
    pois.forEach(poi => {
        L.marker([poi.geoCode.latitude, poi.geoCode.longitude])
            .addTo(plannerMap)
            .bindPopup(`<b>${poi.name}</b>`);
    });
}

document.addEventListener('DOMContentLoaded', initPlanner);