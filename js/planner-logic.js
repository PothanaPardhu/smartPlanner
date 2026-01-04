// js/planner-logic.js
let plannerMap;

async function initPlanner() {
    // 1. Setup Map with basic configuration
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    plannerMap = L.map('map', { zoomControl: false }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(plannerMap);

    // 2. Extract context from URL
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');
    const pace = parseInt(urlParams.get('pace')) || 4;
    const budget = urlParams.get('budget') || 'mid';
    const duration = parseInt(urlParams.get('duration')) || 1;

    // 3. Safety Guard: Check if city exists
    if (!city || city.trim() === "") {
        console.error("No city provided in URL");
        document.getElementById('itinerary-list').innerHTML = `
            <div class="p-10 text-center">
                <p class="text-red-500 font-bold mb-4">No destination provided.</p>
                <a href="index.html" class="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm shadow-md">Go back to search</a>
            </div>`;
        return;
    }

    document.getElementById('dest-name').innerText = `Roadmap for ${city}`;

    try {
        // Show loading state
        document.getElementById('itinerary-list').innerHTML = '<div class="p-10 text-center text-slate-400 animate-pulse font-semibold">Designing your expert roadmap...</div>';

        await getAmadeusToken();
        const data = await getCityData(city);
        
        // Safety Guard: Check if API returned coordinates
        if (!data || isNaN(data.lat)) {
            throw new Error("Invalid location data received.");
        }

        // Fetch Weather with a catch to prevent whole app crash if key is inactive
        let weather = null;
        try {
            weather = await getRealTimeWeather(data.lat, data.lon);
        } catch (wErr) {
            console.warn("Weather API currently unavailable or unauthorized.");
        }

        // Inside initPlanner function in js/planner-logic.js

// ... after getting data and weather ...

const imageData = await getDestinationImage(city);
const header = document.getElementById('itinerary-header');

// Create a professional banner for the sidebar
const banner = document.createElement('div');
banner.className = "w-full h-40 rounded-3xl mb-6 overflow-hidden relative shadow-lg group";
banner.innerHTML = `
    <img src="${imageData.url}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
    <div class="absolute bottom-2 left-3 text-[9px] text-white/80 backdrop-blur-sm bg-black/20 px-2 py-1 rounded-full">
        Photo by <a href="${imageData.profile}" target="_blank" class="underline">${imageData.photographer}</a> on <a href="https://unsplash.com" target="_blank" class="underline">Unsplash</a>
    </div>
`;
header.prepend(banner);
        
        // 4. GENERATE CONTENT (Duration aware)
        const itineraryDays = generateSmartItinerary(data.pois, pace, duration);
        const costs = getBudgetEstimates(budget, data.pois);

        // 5. RENDER UI
        renderDashboard(itineraryDays, costs, weather);
        updatePlannerMap(data.lat, data.lon, data.pois);
        
    } catch (err) {
        console.error("Dashboard Error:", err);
        document.getElementById('itinerary-list').innerHTML = `
            <div class="p-10 text-center text-slate-500">
                <p class="text-red-500 font-bold mb-2">Location Fetch Failed</p>
                <p class="text-xs">We couldn't find "${city}". Please check your API keys or try a major city name.</p>
                <a href="index.html" class="inline-block mt-4 text-indigo-600 font-bold underline">Try Again</a>
            </div>`;
    }
}

function renderDashboard(days, costs, weather) {
    const list = document.getElementById('itinerary-list');
    list.innerHTML = '';

    // A. WEATHER ALERT (Renders only if API responded successfully)
    if (weather && weather.weather && weather.weather[0]) {
        const temp = Math.round(weather.main.temp);
        const condition = weather.weather[0].main;
        const weatherHTML = `
            <div class="bg-indigo-600 p-5 rounded-3xl mb-6 text-white shadow-lg flex items-center justify-between">
                <div>
                    <h5 class="text-[10px] font-bold opacity-70 uppercase tracking-widest">Live Weather</h5>
                    <p class="text-2xl font-bold font-poppins">${temp}°C, ${condition}</p>
                </div>
                <img src="http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" class="w-16 h-16" alt="weather-icon">
            </div>
        `;
        list.insertAdjacentHTML('beforeend', weatherHTML);
    }

    // B. PRODUCTION BUDGET CARD
    const budgetCard = `
        <div class="bg-slate-900 p-6 rounded-3xl mb-8 text-white shadow-2xl">
            <h5 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Estimated Daily Spend</h5>
            <p class="text-3xl font-bold">$${costs.total}</p>
            <div class="mt-4 space-y-2 opacity-80 text-[10px]">
                <div class="flex justify-between border-b border-white/10 pb-1">
                    <span>🏛 Famous Monuments (Est):</span> 
                    <span>$${costs.activities}</span>
                </div>
                <div class="flex justify-between">
                    <span>🍴 Food & Stay:</span> 
                    <span>$${costs.stay + costs.food}</span>
                </div>
            </div>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', budgetCard);

    // C. DAILY ROADMAP
    if (days.length === 0) {
        list.innerHTML += `<p class="p-6 text-center text-slate-400 italic">No landmarks found nearby.</p>`;
        return;
    }

    days.forEach((day, idx) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = "mb-10";
        dayDiv.innerHTML = `<h3 class="text-md font-bold text-slate-800 mb-5 px-3 border-l-4 border-indigo-600">Day ${idx + 1} Plan</h3>`;

        day.forEach(spot => {
            const card = document.createElement('div');
            // Visual highlight for famous monuments
            card.className = `p-5 rounded-2xl border mb-4 transition-all group ${spot.isFamous ? 'border-amber-200 bg-amber-50/40 shadow-md' : 'border-slate-100 bg-white'}`;
            
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[9px] font-bold ${spot.isFamous ? 'text-amber-600' : 'text-indigo-600'} uppercase">
                        ${spot.isFamous ? '⭐ Famous Monument' : spot.timeSlot}
                    </span>
                    <span class="text-[9px] font-bold text-slate-400">Fee: $${spot.entranceFee}</span>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-4 group-hover:text-indigo-600 transition">${spot.name}</h4>
                <div class="flex gap-2">
                    <button onclick="window.open('https://www.viator.com/search/${encodeURIComponent(spot.name)}')" 
                       class="flex-1 py-2 ${spot.isFamous ? 'bg-amber-500' : 'bg-slate-900'} text-white text-[9px] font-bold rounded-xl shadow-lg">
                       BOOK TICKETS
                    </button>
                    <button onclick="focusOnMap(${spot.geoCode.latitude}, ${spot.geoCode.longitude}, '${spot.name.replace(/'/g, "\\'")}')" 
                       class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-xl">
                       LOCATE
                    </button>
                </div>
            `;
            dayDiv.appendChild(card);
        });
        list.appendChild(dayDiv);
    });
}

/**
 * Helper to fly the map to a specific spot and show popup
 */
function focusOnMap(lat, lon, name) {
    plannerMap.flyTo([lat, lon], 16, { duration: 1.5 });
    L.popup()
        .setLatLng([lat, lon])
        .setContent(`<b class="text-indigo-600">${name}</b>`)
        .openOn(plannerMap);
}

function updatePlannerMap(lat, lon, pois) {
    // Clear existing markers if any
    plannerMap.eachLayer((layer) => {
        if (layer instanceof L.Marker) plannerMap.removeLayer(layer);
    });

    plannerMap.flyTo([lat, lon], 13);
    pois.forEach(poi => {
        L.marker([poi.geoCode.latitude, poi.geoCode.longitude])
            .addTo(plannerMap)
            .bindPopup(`<b>${poi.name}</b><br><span class="text-xs text-slate-400">${poi.category}</span>`);
    });
}

document.addEventListener('DOMContentLoaded', initPlanner);