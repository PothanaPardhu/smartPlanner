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