// js/planner-logic.js
let plannerMap;

async function initPlanner() {
    // 1. Setup Map
    plannerMap = L.map('map', { zoomControl: false }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(plannerMap);

    // 2. Extract context from URL
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');
    const pace = urlParams.get('pace') || 4;
    const budget = urlParams.get('budget') || 'mid';

    if (!city) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById('dest-name').innerText = `Roadmap for ${city}`;

    try {
        // Show loading state in the list
        document.getElementById('itinerary-list').innerHTML = '<div class="p-10 text-center text-slate-400">Syncing with travel experts...</div>';

        await getAmadeusToken();
        const data = await getCityData(city);
        
        // FETCH REAL-TIME WEATHER
        // Note: If this returns a 401, the 'weather' variable will be null/undefined
        const weather = await getRealTimeWeather(data.lat, data.lon);
        
        // GENERATE SMART CONTENT
        const itineraryDays = generateSmartItinerary(data.pois, pace);
        const costs = getBudgetEstimates(budget);

        // RENDER EVERYTHING
        renderActionableDashboard(itineraryDays, costs, weather);
        updatePlannerMap(data.lat, data.lon, data.pois);
        
    } catch (err) {
        console.error("Dashboard Error:", err);
        document.getElementById('itinerary-list').innerHTML = `<p class="text-red-500 p-6">Error: Location data unavailable. Please check your API keys.</p>`;
    }
}

function renderActionableDashboard(days, costs, weather) {
    const list = document.getElementById('itinerary-list');
    list.innerHTML = ''; // Clear loading state

    // A. WEATHER ALERT (With Safety Guards to prevent 401 crashes)
    if (weather && weather.weather && weather.weather[0]) {
        const isRainy = weather.weather[0].main.toLowerCase().includes('rain');
        const alertBg = isRainy ? 'from-slate-700 to-slate-900' : 'from-blue-500 to-indigo-600';
        
        const weatherHTML = `
            <div class="bg-gradient-to-r ${alertBg} p-5 rounded-3xl mb-6 text-white shadow-xl flex items-center justify-between">
                <div>
                    <h5 class="text-[10px] font-bold opacity-70 uppercase tracking-widest">Destination Status</h5>
                    <p class="text-2xl font-bold font-poppins">${Math.round(weather.main.temp)}°C, ${weather.weather[0].main}</p>
                    ${isRainy ? '<p class="text-[9px] mt-1 bg-yellow-400 text-black px-2 py-0.5 rounded inline-block font-bold">Rain Alert: Carry an umbrella!</p>' : ''}
                </div>
                <img src="http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" class="w-16 h-16">
            </div>
        `;
        list.insertAdjacentHTML('beforeend', weatherHTML);
    } else {
        console.warn("Weather data skipped: API Key may be inactive or unauthorized (401).");
    }

    // B. BUDGET INSIGHT CARD
    const budgetCard = `
        <div class="bg-white p-6 rounded-3xl mb-8 border border-slate-100 shadow-sm">
            <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Estimated Daily Spend</h5>
            <div class="flex items-baseline gap-1">
                <span class="text-3xl font-bold text-slate-900">$${costs.total}</span>
                <span class="text-xs text-slate-500">per person</span>
            </div>
            <div class="mt-4 flex gap-3">
                <div class="text-[9px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">🏨 Stay: $${costs.stay}</div>
                <div class="text-[9px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">🍴 Food: $${costs.food}</div>
            </div>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', budgetCard);

    // C. DAILY ROADMAP
    days.forEach((day, idx) => {
        const daySection = document.createElement('div');
        daySection.className = "mb-12";
        daySection.innerHTML = `<h3 class="text-lg font-bold text-slate-800 mb-5 px-3 border-l-4 border-indigo-600">Day ${idx + 1}</h3>`;

        day.forEach(spot => {
            const card = document.createElement('div');
            card.className = "bg-white p-5 rounded-2xl border border-slate-100 mb-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group";
            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase">${spot.timeSlot}</span>
                    <span class="text-[9px] text-slate-400 font-bold">${spot.duration}</span>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-4 group-hover:text-indigo-600 transition">${spot.name}</h4>
                <div class="flex gap-2">
                    <a href="https://www.google.com/search?q=Tickets+for+${encodeURIComponent(spot.name)}" target="_blank" 
                       class="flex-1 py-2 bg-slate-900 text-white text-[9px] font-bold rounded-xl text-center hover:bg-indigo-600 transition shadow-lg">
                       GET TICKETS
                    </a>
                    <button onclick="plannerMap.flyTo([${spot.geoCode.latitude}, ${spot.geoCode.longitude}], 16)" 
                       class="px-4 py-2 bg-slate-50 text-slate-600 text-[9px] font-bold rounded-xl hover:bg-slate-200 transition">
                       LOCATE
                    </button>
                </div>
            `;
            daySection.appendChild(card);
        });
        list.appendChild(daySection);
    });
}

function updatePlannerMap(lat, lon, pois) {
    plannerMap.flyTo([lat, lon], 13, { duration: 2 });
    pois.forEach(poi => {
        const marker = L.marker([poi.geoCode.latitude, poi.geoCode.longitude]).addTo(plannerMap);
        marker.bindPopup(`<b class="text-indigo-600">${poi.name}</b><br><span class="text-xs text-slate-500">${poi.category}</span>`);
    });
}

document.addEventListener('DOMContentLoaded', initPlanner);