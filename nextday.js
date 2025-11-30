class NextDayPlanner {
    constructor() {
        this.storage = new WorkoutStorage();
        this.currentDisplayDate = new Date();
        this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() + 1); // Start with tomorrow
        this.init();
    }

    init() {
        this.setupUserGreeting();
        this.displayCurrentDay();
        this.updateDayDisplay();
        this.bindEvents();
    }

    setupUserGreeting() {
        const settings = JSON.parse(localStorage.getItem('workoutTracker_settings') || '{}');
        const userName = settings.userName || 'Fitness Enthusiast';
        document.getElementById('userNameDisplay').textContent = `Hello ${userName}! Plan your fitness journey`;
    }

    displayCurrentDay() {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        document.getElementById('currentDayName').textContent = `Today is ${dayName}`;
    }

    updateDayDisplay() {
        const displayDate = new Date(this.currentDisplayDate);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        // Update day name
        const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'long' });
        document.getElementById('displayDayName').textContent = dayName;
        
        // Update date description
        let dateDescription = '';
        if (displayDate.toDateString() === tomorrow.toDateString()) {
            dateDescription = 'Tomorrow';
        } else if (displayDate.toDateString() === today.toDateString()) {
            dateDescription = 'Today';
        } else {
            dateDescription = displayDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
        document.getElementById('displayDate').textContent = dateDescription;

        // Update button states
        this.updateButtonStates();
        
        // Load and display plan for this day
        this.loadAndDisplayPlan();
    }

    updateButtonStates() {
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        const today = new Date();
        
        // Disable previous button if we're at today
        prevBtn.disabled = this.currentDisplayDate.toDateString() === today.toDateString();
        
        // You can set a limit for how far ahead users can look (optional)
        const maxFutureDate = new Date();
        maxFutureDate.setDate(today.getDate() + 30); // 30 days in future max
        nextBtn.disabled = this.currentDisplayDate >= maxFutureDate;
    }

    loadAndDisplayPlan() {
        const plan = this.getPlanForDate(this.currentDisplayDate);
        this.renderPlan(plan);
    }

    getPlanForDate(date) {
        const plans = this.storage.getPlans();
        const dayOfWeek = date.getDay();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        for (const plan of plans) {
            if (plan.days && plan.days.length > 0) {
                const matchingDay = plan.days.find(day => 
                    day.name.toLowerCase() === dayName
                );
                
                if (matchingDay) {
                    return {
                        plan: plan,
                        day: matchingDay,
                        date: date
                    };
                }
            }
        }

        return null;
    }

    renderPlan(plan) {
        const planInfo = document.getElementById('nextPlanInfo');
        const noPlan = document.getElementById('noPlan');

        if (!plan) {
            planInfo.classList.add('hidden');
            noPlan.classList.remove('hidden');
            return;
        }

        planInfo.classList.remove('hidden');
        noPlan.classList.add('hidden');

        let exercisesHTML = '';
        if (plan.day.exercises && plan.day.exercises.length > 0) {
            plan.day.exercises.forEach(exercise => {
                exercisesHTML += `
                    <div class="exercise-card">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-details">
                            <div class="detail-item">
                                <span class="detail-label">Sets</span>
                                <span class="detail-value">${exercise.sets}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Target</span>
                                <span class="detail-value">${exercise.target} ${exercise.type === 'time' ? 'sec' : 'reps'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Type</span>
                                <span class="detail-value">${exercise.type === 'time' ? 'Timed' : 'Reps'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            exercisesHTML = '<p>No specific exercises planned for this day.</p>';
        }

        planInfo.innerHTML = `
            <div class="plan-header">
                <div class="plan-title">${plan.plan.name}</div>
                <div class="day-title">${plan.day.name} Workout</div>
            </div>
            <div class="exercises-list">
                ${exercisesHTML}
            </div>
        `;
    }

    bindEvents() {
        // Day navigation
        document.getElementById('prevDayBtn').addEventListener('click', () => {
            this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() - 1);
            this.updateDayDisplay();
        });

        document.getElementById('nextDayBtn').addEventListener('click', () => {
            this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() + 1);
            this.updateDayDisplay();
        });

        // Reset to tomorrow
        document.getElementById('resetDayBtn').addEventListener('click', () => {
            this.currentDisplayDate = new Date();
            this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() + 1);
            this.updateDayDisplay();
            alert('Reset to tomorrow\'s plan!');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NextDayPlanner();
});