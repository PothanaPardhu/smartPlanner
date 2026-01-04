// js/itinerary-generator.js

function generateSmartItinerary(pois, pace) {
    const days = [];
    const spotsPerDay = parseInt(pace) || 4;
    
    // Sort so "Famous" items (Museums/Castles) appear first in the plan
    const sortedPois = [...pois].sort((a, b) => {
        const highValue = ["MUSEUM", "CASTLE", "FORT", "MONUMENT"];
        const aVal = highValue.some(el => a.category.includes(el)) ? 1 : 0;
        const bVal = highValue.some(el => b.category.includes(el)) ? 1 : 0;
        return bVal - aVal;
    });

    for (let i = 0; i < sortedPois.length; i += spotsPerDay) {
        const daySpots = sortedPois.slice(i, i + spotsPerDay);
        
        if (daySpots.length > 0) {
            const structuredDay = daySpots.map((spot, index) => {
                let slot = "Morning";
                if (index >= spotsPerDay / 2) slot = "Afternoon";
                if (index >= (spotsPerDay * 0.75)) slot = "Evening";
                
                return {
                    ...spot,
                    timeSlot: slot,
                    duration: "2.5 Hours",
                    isFamous: ["MUSEUM", "CASTLE", "MONUMENT", "FORT"].some(el => spot.category.includes(el))
                };
            });
            days.push(structuredDay);
        }
    }
    return days; 
}

function getBudgetEstimates(budgetLevel, allPois) {
    const profiles = {
        budget: { food: 25, stay: 45, multiplier: 1 },
        mid: { food: 60, stay: 110, multiplier: 1.5 },
        luxury: { food: 150, stay: 400, multiplier: 3 }
    };
    const base = profiles[budgetLevel] || profiles.mid;
    
    // Sum entrance fees of selected spots
    const totalEntranceFees = allPois.reduce((sum, spot) => sum + (spot.entranceFee || 0), 0);
    // Average daily ticket spend
    const activityDaily = Math.round((totalEntranceFees * base.multiplier) / (allPois.length / 4 || 1));

    return {
        food: base.food,
        stay: base.stay,
        activities: activityDaily,
        total: (base.food + base.stay + activityDaily).toFixed(2)
    };
}