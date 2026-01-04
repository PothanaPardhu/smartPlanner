// js/main.js

async function startPlanning() {
    const city = document.getElementById('citySearch').value;
    const budget = document.getElementById('budgetLevel').value;
    const pace = document.getElementById('travelPace').value;
    
    if (!city) {
        alert("Please enter a destination!");
        return;
    }

    // Capture the context and move to the Roadmap (planner.html)
    const params = new URLSearchParams({
        city: city,
        budget: budget,
        pace: pace
    });

    window.location.href = `planner.html?${params.toString()}`;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.classList.add('py-2', 'bg-white/95');
    } else {
        nav.classList.add('py-4', 'bg-white/80');
    }
});

async function startPlanning() {
    const city = document.getElementById('citySearch').value;
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDate').value;
    const budget = document.getElementById('budgetLevel').value;
    const pace = document.getElementById('travelPace').value;
    
    if (!city || !startVal || !endVal) {
        alert("Please fill in destination and both dates!");
        return;
    }

    const start = new Date(startVal);
    const end = new Date(endVal);
    
    // Calculate total days (e.g., Jan 1 to Jan 3 is 3 days)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) {
        alert("End date must be after start date!");
        return;
    }

    const params = new URLSearchParams({
        city: city,
        budget: budget,
        pace: pace,
        duration: diffDays
    });

    window.location.href = `planner.html?${params.toString()}`;
}

// js/main.js

// Existing startPlanning function... (keep as is)

// NEW: Dynamic Background Logic
const cityInput = document.getElementById('citySearch');
const heroBgImage = document.querySelector('#home img');

if (cityInput && heroBgImage) {
    // We use 'blur' so the background updates when the user clicks away from the input
    cityInput.addEventListener('blur', async () => {
        const city = cityInput.value.trim();
        if (city.length > 2) {
            const imageData = await getDestinationImage(city);
            
            // Apply smooth fade transition
            heroBgImage.style.opacity = '0.3';
            setTimeout(() => {
                heroBgImage.src = imageData.url;
                heroBgImage.style.opacity = '1';
                heroBgImage.style.transition = 'opacity 0.8s ease-in-out';
            }, 300);
        }
    });
}