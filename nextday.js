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

    // Premium Message Method
    showPremiumMessage(type, title, message) {
        // Remove any existing message
        const existingMessage = document.querySelector('.premium-message');
        if (existingMessage) {
            existingMessage.classList.add('hiding');
            setTimeout(() => existingMessage.remove(), 500);
        }
        
        const icons = {
            reset: 'fas fa-sync-alt'
        };
        
        const messageHTML = `
            <div class="premium-message ${type}">
                <div class="message-header">
                    <i class="message-icon ${icons[type]}"></i>
                    <h4 class="message-title">${title}</h4>
                </div>
                <div class="message-content">${message}</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', messageHTML);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            const messageEl = document.querySelector('.premium-message');
            if (messageEl) {
                messageEl.classList.add('hiding');
                setTimeout(() => messageEl.remove(), 500);
            }
        }, 3000);
    }

    bindEvents() {
        // Day navigation
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        const dayInfo = document.querySelector('.day-info');

        prevBtn.addEventListener('click', () => {
            // Add arrow tap animation
            prevBtn.style.animation = 'arrowTap 0.2s ease';
            setTimeout(() => {
                prevBtn.style.animation = '';
            }, 200);
            
            // Add slide back animation to day info
            dayInfo.classList.add('day-slide-back');
            setTimeout(() => {
                this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() - 1);
                this.updateDayDisplay();
                dayInfo.classList.remove('day-slide-back');
            }, 200);
        });

        nextBtn.addEventListener('click', () => {
            // Add arrow tap animation
            nextBtn.style.animation = 'arrowTap 0.2s ease';
            setTimeout(() => {
                nextBtn.style.animation = '';
            }, 200);
            
            // Add slide forward animation to day info
            dayInfo.classList.add('day-slide-forward');
            setTimeout(() => {
                this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() + 1);
                this.updateDayDisplay();
                dayInfo.classList.remove('day-slide-forward');
            }, 200);
        });

        // Reset to tomorrow with animation
        const resetBtn = document.getElementById('resetDayBtn');
        resetBtn.addEventListener('click', () => {
            // Add reset button animation
            resetBtn.classList.add('reset-success');
            setTimeout(() => {
                resetBtn.classList.remove('reset-success');
            }, 1000);
            
            // Add today focus animation to day info
            dayInfo.classList.add('today-focus');
            
            // Reset date and update display
            this.currentDisplayDate = new Date();
            this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() + 1);
            this.updateDayDisplay();
            
            // Show premium message
            this.showPremiumMessage('reset', 'Reset Complete', 
                'Successfully reset to tomorrow\'s plan! Ready for your next workout.');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                dayInfo.classList.remove('today-focus');
            }, 600);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NextDayPlanner();
});