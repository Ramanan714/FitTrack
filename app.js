class App {
    constructor() {
        this.storage = new WorkoutStorage();
        this.settings = this.loadSettings();
        this.profileData = this.loadProfileData();
        this.init();
    }

    // Add this debug method to check profile data
debugProfileData() {
    console.log('=== PROFILE DATA DEBUG ===');
    console.log('Profile data:', this.profileData);
    console.log('Has image?', !!this.profileData.image);
    console.log('Image type:', typeof this.profileData.image);
    if (this.profileData.image) {
        console.log('Image length:', this.profileData.image.length);
        console.log('Image preview:', this.profileData.image.substring(0, 100));
    }
    console.log('=== END DEBUG ===');
}


 // Update the init method
init() {
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupDate();
            this.updateWelcomeMessage();
            this.updateStats();
            this.loadRecentActivity();
            this.bindEvents();
            this.setupAnimations(); // Add this line
            this.debugProfileData();
        });
    } else {
        this.setupDate();
        this.updateWelcomeMessage();
        this.updateStats();
        this.loadRecentActivity();
        this.bindEvents();
        this.setupAnimations(); // Add this line
    }
    
    console.log('All workouts:', this.storage.getWorkouts());
}

    // Add this method to load profile data
    loadProfileData() {
        const defaultData = {
            name: '',
            tagline: '',
            image: null,
            createdAt: null,
            updatedAt: null
        };
        
        const saved = localStorage.getItem('workoutTracker_profile');
        if (saved) {
            return { ...defaultData, ...JSON.parse(saved) };
        }
        
        // Check old settings for backward compatibility
        const oldSettings = JSON.parse(localStorage.getItem('workoutTracker_settings') || '{}');
        if (oldSettings.userName) {
            return { ...defaultData, name: oldSettings.userName };
        }
        
        return defaultData;
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

        const userName = this.profileData.name || 'Fitness Enthusiast';
        const welcomeElement = document.getElementById('welcomeMessage');
        
        if (welcomeElement) {
            welcomeElement.textContent = `${greeting}, ${userName}!`;
        } else {
            console.error('Element with id "welcomeMessage" not found');
        }
        
        // Update welcome avatar
        this.updateWelcomeAvatar();
    }

    // Update the updateWelcomeAvatar method
updateWelcomeAvatar() {
    const avatarFallback = document.getElementById('avatarFallback');
    const userAvatarImage = document.getElementById('userAvatarImage');
    
    // Check if we have a profile image
    if (this.profileData && this.profileData.image) {
        console.log('Profile image found:', this.profileData.image.substring(0, 50) + '...');
        
        // Set the image source
        userAvatarImage.src = this.profileData.image;
        
        // Show the image, hide the fallback
        userAvatarImage.style.display = 'block';
        avatarFallback.style.display = 'none';
        
        // Add error handling in case image fails to load
        userAvatarImage.onerror = () => {
            console.error('Failed to load profile image');
            userAvatarImage.style.display = 'none';
            avatarFallback.style.display = 'flex';
        };
        
        // Check if image loads successfully
        userAvatarImage.onload = () => {
            console.log('Profile image loaded successfully');
        };
    } else {
        console.log('No profile image found, showing fallback');
        userAvatarImage.style.display = 'none';
        avatarFallback.style.display = 'flex';
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

     // Update loadRecentActivity to remove time from workout duration display
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
            
            // Remove time (like "5m") and just show date
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${workout.planName || 'Workout'}</div>
                        <div class="activity-details">
                            ${formattedDate}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Remove or modify formatDuration method since we're not showing time
    formatDuration(seconds) {
        // Just return empty string since we're not showing duration
        return '';
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

    // Remove any cursor hover fade effects from bindEvents method
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
    document.getElementById('resetData').addEventListener('click', () => this.resetData());

    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            this.closeSettings();
        }
    });
}

    // Update the openSettings method to show user info if logged in
    openSettings() {
        const modal = document.getElementById('settingsModal');
        
        // Load current theme
        const savedTheme = localStorage.getItem('theme') || 'auto';
        const themeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
        
        // Load profile data for settings display
        const profileData = this.profileData;
        const settingsUserName = document.getElementById('settingsUserName');
        const settingsUserDesc = document.getElementById('settingsUserDesc');
        const settingsAvatarIcon = document.getElementById('settingsAvatarIcon');
        const settingsAvatarImage = document.getElementById('settingsAvatarImage');
        
        if (profileData.name) {
            // User has a profile
            settingsUserName.textContent = profileData.name;
            settingsUserDesc.textContent = profileData.tagline || 'View and edit your profile';
            
            // Display profile image if available
            if (profileData.image) {
                settingsAvatarImage.src = profileData.image;
                settingsAvatarImage.style.display = 'block';
                settingsAvatarIcon.querySelector('i').style.display = 'none';
            } else {
                settingsAvatarImage.style.display = 'none';
                settingsAvatarIcon.querySelector('i').style.display = 'block';
                settingsAvatarIcon.style.background = 'linear-gradient(135deg, var(--primary-color), #0056b3)';
            }
        } else {
            // No profile set up
            settingsUserName.textContent = 'Set up your profile';
            settingsUserDesc.textContent = 'Customize name, photo & notifications';
            settingsAvatarImage.style.display = 'none';
            settingsAvatarIcon.querySelector('i').style.display = 'block';
            settingsAvatarIcon.style.background = 'linear-gradient(135deg, var(--primary-color), #0056b3)';
        }
        
        modal.classList.add('show');
    }


    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
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

 setupAnimations() {
    // Animate elements with delays
    setTimeout(() => {
        // 1. Animate welcome card (Hero Card Slide-In)
        const welcomeCard = document.querySelector('.welcome-card');
        if (welcomeCard) {
            welcomeCard.classList.add('animate-hero');
        }
        
        // 2. Animate navigation cards (Staggered Card Cascade)
        document.querySelectorAll('.nav-card').forEach(card => {
            card.classList.add('animate-cascade');
        });
        
        // Animate stats cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('animate-cascade');
        });
        
        // Animate action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.classList.add('animate-cascade');
        });
        
        // Animate all-time best card
        const alltimebestCard = document.querySelector('.alltimebest-card');
        if (alltimebestCard) {
            alltimebestCard.classList.add('animate-cascade');
        }
        
        // Animate section titles
        document.querySelectorAll('.section-title').forEach(title => {
            title.classList.add('animate-cascade');
        });
        
        // Animate activity list
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            activityList.classList.add('animate-cascade');
        }
        
        // Animate today's workout status
        const todayStatus = document.getElementById('todayWorkoutStatus');
        if (todayStatus) {
            todayStatus.classList.add('animate-cascade');
        }
        
        // 3. Icons already have float animation via CSS
        // 4. Background gradient shift already running via CSS
        // 5. Micro-interaction hovers already applied via CSS
        
    }, 300);
}

// Remove the createElectricFlash method completely
// No more blue flash on page load

// Add this method to create electric flash
createElectricFlash() {
    const overlay = document.createElement('div');
    overlay.className = 'electric-flash-overlay';
    document.body.appendChild(overlay);
    
    // Remove overlay after animation
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 800);
}

// Add this method to apply blue pulse to main elements
applyBluePulse() {
    // Add pulse to welcome card
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) {
        welcomeCard.style.animation = 'bluePulse 4s ease-in-out infinite';
    }
    
    // Add pulse to main navigation cards on hover
    document.querySelectorAll('.nav-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.animation = 'bluePulse 1.5s ease-in-out';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.animation = '';
        });
    });
}

// Add this method to show premium messages
    showPremiumMessage(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.premium-toast');
        existingToasts.forEach(toast => toast.remove());
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `premium-toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            error: 'fas fa-exclamation-circle'
        };
        
        const titles = {
            success: 'Success!',
            warning: 'Warning!',
            info: 'Info',
            error: 'Error!'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // Add this method to create confetti animation
    createConfettiAnimation() {
        const confettiContainer = document.getElementById('confettiContainer');
        if (!confettiContainer) {
            // Create container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'confettiContainer';
            container.className = 'confetti-container';
            document.body.appendChild(container);
        }
        
        confettiContainer.style.display = 'block';
        confettiContainer.innerHTML = '';
        
        // Create multiple confetti pieces
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#FFD166'];
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random position and style
            const left = Math.random() * 100;
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const duration = Math.random() * 2 + 2;
            const delay = Math.random() * 1;
            
            confetti.style.cssText = `
                left: ${left}%;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            `;
            
            confettiContainer.appendChild(confetti);
        }
         // Hide confetti after animation
        setTimeout(() => {
            confettiContainer.style.display = 'none';
        }, 4000);
    }
        
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});