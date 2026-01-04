// js/itinerary-generator.js

/**
 * Logic to group POIs into specific days and time slots
 */
function generateSmartItinerary(pois, pace) {
    const days = [];
    const spotsPerDay = parseInt(pace) || 4;
    
    // Split the markers into chunks (Days)
    for (let i = 0; i < pois.length; i += spotsPerDay) {
        const daySpots = pois.slice(i, i + spotsPerDay);
        
        const structuredDay = daySpots.map((spot, index) => {
            let slot = "Morning";
            if (index >= spotsPerDay / 2) slot = "Afternoon";
            if (index >= (spotsPerDay * 0.75)) slot = "Evening";
            
            return {
                ...spot,
                timeSlot: slot,
                duration: "2-3 Hours"
            };
        });
        
        days.push(structuredDay);
        if (days.length >= 7) break; // Limit to a 1-week plan
    }
    return days;
}

/**
 * Provides cultural/financial insights based on budget selection
 */
function getBudgetEstimates(budgetLevel) {
    const profiles = {
        budget: { food: 30, stay: 50, total: 80 },
        mid: { food: 70, stay: 120, total: 190 },
        luxury: { food: 150, stay: 400, total: 550 }
    };
    return profiles[budgetLevel] || profiles.mid;
}