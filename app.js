class App {
    constructor() {
        this.storage = new WorkoutStorage();
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupDate();
            this.updateWelcomeMessage();
            this.updateStats();
            this.loadRecentActivity();
            this.bindEvents();
        });
    } else {
        this.setupDate();
        this.updateWelcomeMessage();
        this.updateStats();
        this.loadRecentActivity();
        this.bindEvents();
    }
    
    console.log('All workouts:', this.storage.getWorkouts());
}

    loadSettings() {
        const defaultSettings = {
            userName: '',
            theme: 'auto'
        };
        
        const saved = localStorage.getItem('workoutTracker_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('workoutTracker_settings', JSON.stringify(this.settings));
    }

    updateWelcomeMessage() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Hello';
    
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    const userName = this.settings.userName || 'Fitness Enthusiast';
    const welcomeElement = document.getElementById('welcomeMessage');
    
    if (welcomeElement) {
        welcomeElement.textContent = `${greeting}, ${userName}!`;
    } else {
        console.error('Element with id "welcomeMessage" not found');
    }
}

    setupDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateElement = document.getElementById('currentDate');
    
    if (currentDateElement) {
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    } else {
        console.error('Element with id "currentDate" not found');
    }
}

    updateStats() {
        const workouts = this.storage.getWorkouts();
        const streak = this.calculateStreak(workouts);
        const totalWorkouts = workouts.length;
        const nextPlan = this.getNextPlan();

        document.getElementById('dayStreak').textContent = streak;
        document.getElementById('totalWorkouts').textContent = totalWorkouts;
        document.getElementById('nextPlan').textContent = nextPlan;
        
        console.log('Stats updated - Streak:', streak, 'Total workouts:', totalWorkouts);
        this.updateTodayWorkoutStatus();
    }

    calculateStreak(workouts) {
        console.log('=== STREAK CALCULATION START ===');
        
        if (workouts.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneDay = 24 * 60 * 60 * 1000;
        
        const completedDates = new Set();
        workouts.forEach(workout => {
            if (workout.completed) {
                const workoutDate = new Date(workout.date);
                workoutDate.setHours(0, 0, 0, 0);
                completedDates.add(workoutDate.getTime());
            }
        });
        
        const workoutDays = [1, 2, 4, 5, 6];
        
        let streak = 0;
        let currentDate = new Date(today);
        
        console.log('Looking for most recent consecutive workout days...');
        
        const todayDayOfWeek = today.getDay();
        if (workoutDays.includes(todayDayOfWeek)) {
            if (completedDates.has(today.getTime())) {
                streak++;
                console.log(`✅ ${today.toDateString()} - Today completed. Streak: ${streak}`);
            } else {
                console.log(`⏳ ${today.toDateString()} - Today not completed. Starting from yesterday.`);
            }
        }
        
        currentDate = new Date(today.getTime() - oneDay);
        
        for (let i = 0; i < 30; i++) {
            const dayOfWeek = currentDate.getDay();
            const dateKey = currentDate.getTime();
            
            if (workoutDays.includes(dayOfWeek)) {
                if (completedDates.has(dateKey)) {
                    streak++;
                    console.log(`✅ ${currentDate.toDateString()} - Workout completed. Streak: ${streak}`);
                } else {
                    console.log(`❌ ${currentDate.toDateString()} - Workout missed. Stopping streak count.`);
                    break;
                }
            } else {
                console.log(`🔄 ${currentDate.toDateString()} - Rest day. Streak: ${streak}`);
            }
            
            currentDate = new Date(currentDate.getTime() - oneDay);
        }
        
        console.log('=== FINAL STREAK:', streak, '===');
        return streak;
    }

    getNextPlan() {
        const plans = this.storage.getPlans();
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const tomorrowName = dayNames[tomorrow.getDay()];
        
        if (plans.length > 0) {
            const plan = plans[0];
            if (plan.days && plan.days.length > 0) {
                const tomorrowPlan = plan.days.find(d => d.name === tomorrowName);
                return tomorrowPlan ? tomorrowPlan.name : 'Rest Day';
            }
            return plan.name;
        }
        
        return 'Rest Day';
    }

    updateTodayWorkoutStatus() {
        const workouts = this.storage.getWorkouts();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayWorkout = workouts.find(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);
            return workoutDate.getTime() === today.getTime() && workout.completed;
        });
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = dayNames[today.getDay()];
        
        const plans = this.storage.getPlans();
        let todayFocus = 'Rest Day';
        if (plans.length > 0) {
            const plan = plans[0];
            if (plan.days && plan.days.length > 0) {
                const todayPlan = plan.days.find(d => d.name === todayName);
                if (todayPlan) {
                    const planMapping = {
                        'Monday': 'Arms + Shoulders + Chest',
                        'Tuesday': 'Legs + Glutes', 
                        'Wednesday': 'Rest',
                        'Thursday': 'Abs + Core',
                        'Friday': 'Back + Arms + Chest',
                        'Saturday': 'Full Body',
                        'Sunday': 'Rest'
                    };
                    todayFocus = planMapping[todayName] || todayName;
                }
            }
        }
        
        this.createTodayStatusBox(todayWorkout, todayName, todayFocus);
    }

    createTodayStatusBox(todayWorkout, todayName, todayFocus) {
    let statusBox = document.getElementById('todayWorkoutStatus');
    
    if (!statusBox) {
        statusBox = document.createElement('div');
        statusBox.id = 'todayWorkoutStatus';
        statusBox.className = 'today-workout-status';
        
        // Find the main content area after the welcome card
        const welcomeCard = document.querySelector('.welcome-card');
        const mainContent = document.querySelector('.main-content');
        
        if (welcomeCard && welcomeCard.parentNode) {
            // Insert right after the welcome card
            welcomeCard.parentNode.insertBefore(statusBox, welcomeCard.nextSibling);
        } else if (mainContent) {
            // Insert at the beginning of main content
            mainContent.insertBefore(statusBox, mainContent.firstChild);
        } else {
            console.error('Could not find insertion point for status box');
            return;
        }
    }
    
    const isRestDay = todayFocus === 'Rest';
    const hasWorkoutCompleted = !!todayWorkout;
    
    if (isRestDay) {
        statusBox.innerHTML = `
            <div class="status-content rest-day">
                <div class="status-icon">
                    <i class="fas fa-bed"></i>
                </div>
                <div class="status-text">
                    <h3>Rest Day Today</h3>
                    <p>Enjoy your recovery! ${todayName} is for rest and muscle repair.</p>
                </div>
            </div>
        `;
    } else if (hasWorkoutCompleted) {
        statusBox.innerHTML = `
            <div class="status-content completed">
                <div class="status-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="status-text">
                    <h3>Workout Completed! 🎉</h3>
                    <p>Great job! You've completed your ${todayFocus} workout today.</p>
                </div>
            </div>
        `;
    } else {
        statusBox.innerHTML = `
            <div class="status-content pending">
                <div class="status-icon">
                    <i class="fas fa-dumbbell"></i>
                </div>
                <div class="status-text">
                    <h3>Ready for Today's Workout</h3>
                    <p>Today is ${todayName} - ${todayFocus}. Time to get active!</p>
                </div>
            </div>
        `;
    }
    
    // Make sure it's visible
    statusBox.style.display = 'block';
}

    loadRecentActivity() {
        const workouts = this.storage.getWorkouts();
        const recentWorkouts = document.getElementById('recentWorkouts');
        
        const recent = workouts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
        
        if (recent.length === 0) {
            recentWorkouts.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dumbbell"></i>
                    <p>No workouts yet</p>
                    <small>Start your first workout!</small>
                </div>
            `;
            return;
        }
        
        recentWorkouts.innerHTML = recent.map(workout => {
            const date = new Date(workout.date);
            const duration = workout.duration ? this.formatDuration(workout.duration) : 'N/A';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${workout.planName || 'Workout'}</div>
                        <div class="activity-details">
                            ${date.toLocaleDateString()} • ${duration}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    bindEvents() {
        document.getElementById('quickStartBtn').addEventListener('click', () => {
            window.location.href = 'workout.html';
        });

        document.getElementById('addPlanBtn').addEventListener('click', () => {
            window.location.href = 'plans.html';
        });

        document.getElementById('viewProgressBtn').addEventListener('click', () => {
            window.location.href = 'progress.html';
        });

        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettingsData());
        document.getElementById('resetData').addEventListener('click', () => this.resetData());

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        const userNameInput = document.getElementById('userName');

        userNameInput.value = this.settings.userName || '';

        const themeRadio = document.querySelector(`input[name="theme"][value="${this.settings.theme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }

        modal.classList.add('show');
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    saveSettingsData() {
        const userName = document.getElementById('userName').value.trim();
        const theme = document.querySelector('input[name="theme"]:checked').value;

        this.settings.userName = userName;
        this.settings.theme = theme;

        this.saveSettings();
        this.updateWelcomeMessage();
        this.closeSettings();
        alert('Settings saved successfully!');
    }

    resetData() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone!')) {
            localStorage.removeItem('workoutTracker_workouts');
            localStorage.removeItem('workoutTracker_plans');
            localStorage.removeItem('workoutTracker_settings');
            
            this.settings = this.loadSettings();
            this.updateStats();
            this.loadRecentActivity();
            this.updateWelcomeMessage();
            
            this.closeSettings();
            alert('All data has been reset!');
        }
    }
    
    testAddWorkout() {
        const testWorkout = {
            date: new Date().toISOString(),
            day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            exercises: [{ name: 'Test Exercise', sets: 3, target: 10, type: 'reps' }],
            duration: 1800,
            completed: true
        };
        
        this.storage.saveWorkout(testWorkout);
        this.updateStats();
        alert('Test workout added! Check console for streak calculation.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});