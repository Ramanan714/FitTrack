class WorkoutManager {
    constructor() {
        this.storage = new WorkoutStorage();
        this.currentDay = '';
        this.currentWorkouts = [];
        this.currentExerciseIndex = 0;
        this.currentSet = 1;
        this.completedWorkouts = 0;
        this.timerInterval = null;
        this.remainingTime = 0;
        this.planMapping = {
            'Monday': 'Arms + Shoulders + Chest',
            'Tuesday': 'Legs + Glutes', 
            'Wednesday': 'Rest',
            'Thursday': 'Abs + Core',
            'Friday': 'Back + Arms + Chest',
            'Saturday': 'Full Body',
            'Sunday': 'Rest'
        };
        this.init();
    }

   init() {
        this.setupCurrentDay();
        this.updateDateTime();
        this.loadTodaysWorkout();
        this.bindEvents();
        this.updateWorkoutReminder();
        
        // Add page load animations
        setTimeout(() => {
            this.triggerWorkoutPageAnimations();
        }, 300);
        
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    // Add this method for page load animations
    triggerWorkoutPageAnimations() {
        // Create electric lightning overlay
        this.createElectricLightningFlash();
        
        // Add animation classes to elements
        setTimeout(() => {
            // Add animated class to main content
            document.querySelector('.workout-main-content').classList.add('animated');
            
            // Animate header
            const headerTitle = document.querySelector('.header-content h1');
            if (headerTitle) {
                headerTitle.style.animation = 'workoutHeadingGlow 3s ease-in-out infinite 0.5s';
            }
            
            // Animate section titles
            document.querySelectorAll('.section-title').forEach(title => {
                title.classList.add('animate-electric');
            });
            
            // Animate progress section
            const progressContainer = document.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.classList.add('animate-electric');
            }
            
            // Animate workout reminder
            const workoutReminder = document.querySelector('.workout-reminder');
            if (workoutReminder) {
                workoutReminder.classList.add('animate-electric');
            }
            
            // Animate current workout section
            const currentWorkoutSection = document.querySelector('.current-workout-section');
            if (currentWorkoutSection) {
                currentWorkoutSection.classList.add('animate-electric');
            }
            
            // Animate workout plan section
            const workoutPlanSection = document.querySelector('.workout-plan-section');
            if (workoutPlanSection) {
                workoutPlanSection.classList.add('animate-electric');
            }
            
            // Animate start workout button
            const startWorkoutBtn = document.querySelector('.start-workout-btn');
            if (startWorkoutBtn) {
                startWorkoutBtn.classList.add('animate-electric');
            }
            
            // Animate workout plan items with staggered delays
            setTimeout(() => {
                this.animateWorkoutPlanItems();
            }, 500);
            
            // Apply continuous blue pulse to interactive elements
            setTimeout(() => {
                this.applyBlueEnergyPulse();
            }, 1500);
            
        }, 500); // Delay after lightning flash
    }

     // Add this method to create electric lightning flash
    createElectricLightningFlash() {
        const overlay = document.createElement('div');
        overlay.className = 'workout-lightning-overlay';
        document.body.appendChild(overlay);
        
        // Remove overlay after animation
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 1500);
    }

    // Add this method to animate workout plan items
    animateWorkoutPlanItems() {
        const workoutPlanItems = document.querySelectorAll('.workout-plan-item');
        workoutPlanItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-electric');
            }, index * 100);
        });
    }

    // Add this method to apply blue energy pulse
    applyBlueEnergyPulse() {
        // Add continuous pulse to start workout button
        const startWorkoutBtn = document.querySelector('.start-workout-btn');
        if (startWorkoutBtn) {
            startWorkoutBtn.style.animation = 'electricGradient 3s ease-in-out infinite';
        }
        
        // Add hover pulse effect to interactive cards
        const detailCards = document.querySelectorAll('.detail-card');
        detailCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.animation = 'workoutBluePulse 1.5s ease-in-out';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.animation = '';
            });
        });
        
        // Animate detail cards when they become visible
        const detailCardElements = document.querySelectorAll('.detail-card');
        detailCardElements.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-electric');
            }, 400 + (index * 100));
        });
    }


    // NEW: Added workout reminder method
updateWorkoutReminder() {
    const settings = JSON.parse(localStorage.getItem('workoutTracker_settings') || '{}');
    const userName = settings.userName || 'Fitness Enthusiast';
    const reminderElement = document.getElementById('userWorkoutReminder');
    
    if (reminderElement) {
        reminderElement.textContent = `Let's go ${userName}! Time to crush your workout!`;
    }
    
    // Load and display user's profile image
    this.loadUserAvatar();
}

// Add this new method to load user avatar
loadUserAvatar() {
    const profileData = JSON.parse(localStorage.getItem('workoutTracker_profile') || '{}');
    const avatarIcon = document.querySelector('.reminder-icon i');
    const avatarImage = document.getElementById('workoutUserAvatar');
    const reminderIcon = document.querySelector('.reminder-icon');
    
    if (profileData && profileData.image) {
        // User has a profile image
        avatarImage.src = profileData.image;
        avatarImage.style.display = 'block';
        avatarIcon.style.display = 'none';
        reminderIcon.classList.add('has-image');
        
        // Handle image loading errors
        avatarImage.onerror = () => {
            console.error('Failed to load profile image for workout reminder');
            avatarImage.style.display = 'none';
            avatarIcon.style.display = 'flex';
            reminderIcon.classList.remove('has-image');
        };
        
        avatarImage.onload = () => {
            console.log('Profile image loaded successfully for workout reminder');
        };
    } else {
        // No profile image, show default icon
        avatarImage.style.display = 'none';
        avatarIcon.style.display = 'flex';
        reminderIcon.classList.remove('has-image');
    }
}

    setupCurrentDay() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date().getDay();
        this.currentDay = days[today];
        
        document.getElementById('currentDay').textContent = 
            `${this.currentDay} (${this.planMapping[this.currentDay]})`;
    }

    updateDateTime() {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        document.getElementById('currentDateTime').textContent = 
            `${dateString} • ${timeString}`;
    }

    loadTodaysWorkout() {
        const plans = this.storage.getPlans();
        const mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
        
        if (!mainPlan) {
            this.showNoWorkoutMessage();
            return;
        }

        const todaysWorkout = mainPlan.days.find(d => d.name === this.currentDay);
        
        if (!todaysWorkout || todaysWorkout.exercises.length === 0) {
            this.showNoWorkoutMessage();
            return;
        }

        this.currentWorkouts = todaysWorkout.exercises;
        this.displayTodaysWorkoutPlan();
        this.updateProgressStats();
    }

    showNoWorkoutMessage() {
        document.getElementById('todaysWorkoutPlan').innerHTML = `
            <div class="no-workout-message">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Workout Planned for Today</h3>
                <p>Enjoy your rest day or add workouts in the Plans section!</p>
            </div>
        `;
        document.getElementById('startWorkoutBtn').disabled = true;
        document.getElementById('startWorkoutBtn').innerHTML = `
            <i class="fas fa-ban"></i>
            No Workout Today
        `;
    }

    displayTodaysWorkoutPlan() {
    const workoutPlanContainer = document.getElementById('todaysWorkoutPlan');
    
    workoutPlanContainer.innerHTML = this.currentWorkouts.map((workout, index) => `
        <div class="workout-plan-item animate-electric" id="workoutPlan-${index}">
            <div class="workout-plan-name">${workout.name}</div>
            <div class="workout-plan-details">
                <div class="workout-plan-detail">
                    <i class="fas fa-sync-alt"></i>
                    <span>${workout.sets} sets</span>
                </div>
                <div class="workout-plan-detail">
                    <i class="fas fa-bullseye"></i>
                    <span>${workout.target} ${workout.type === 'time' ? 'seconds' : 'reps'}</span>
                </div>
                <div class="workout-plan-detail">
                    <i class="fas fa-clock"></i>
                    <span>${workout.type === 'time' ? 'Timed' : 'Reps'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

    // UPDATED: Enhanced progress stats with smoother animations
    updateProgressStats() {
        const totalWorkouts = this.currentWorkouts.length;
        document.getElementById('totalWorkouts').textContent = totalWorkouts;
        document.getElementById('completedWorkouts').textContent = this.completedWorkouts;
        
        const progress = (this.completedWorkouts / totalWorkouts) * 100;
        const progressFill = document.getElementById('progressFill');
        
        // Smooth animation with easing
        progressFill.style.transition = 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        progressFill.style.width = `${progress}%`;
        
        // Add completion celebration when 100%
        if (progress === 100) {
            // Show message immediately with proper animation
setTimeout(() => {
    successMessage.style.display = 'block';
    
    // Force reflow to trigger animation
    void successMessage.offsetWidth;
    
    // Add the animation class
    successMessage.style.animation = 'messageEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    
    // Animate child elements
    const title = successMessage.querySelector('.success-title');
    const message = successMessage.querySelector('.success-message');
    const stats = successMessage.querySelectorAll('.stat');
    const button = successMessage.querySelector('.success-close-btn');
    
    if (title) title.style.animation = 'titlePopIn 0.8s ease-out 0.3s forwards, textGlow 2s ease-in-out infinite';
    if (message) message.style.animation = 'fadeInUp 0.6s ease-out 0.5s forwards';
    
    stats.forEach((stat, index) => {
        stat.style.animation = `statSlideIn 0.6s ease-out ${0.7 + (index * 0.1)}s forwards`;
    });
    
    if (button) button.style.animation = `buttonSlideUp 0.6s ease-out 1s forwards, buttonPulse 2s infinite 1.6s`;
}, 100);
        }
    }

    bindEvents() {
        document.getElementById('startWorkoutBtn').addEventListener('click', () => this.startWorkout());
        document.getElementById('actionBtn').addEventListener('click', () => this.handleAction());
        document.getElementById('finishWorkoutBtn').addEventListener('click', () => this.finishWorkout());
    }

    startWorkout() {
        document.getElementById('workoutStart').classList.add('hidden');
        document.getElementById('currentExercise').classList.remove('hidden');
        document.getElementById('workoutSubtitle').textContent = 'Current Exercise';
        
        this.currentExerciseIndex = 0;
        this.currentSet = 1;
        this.completedWorkouts = 0;
        this.loadCurrentExercise();
    }

    loadCurrentExercise() {
        if (this.currentExerciseIndex >= this.currentWorkouts.length) {
            this.completeWorkout();
            return;
        }

        const exercise = this.currentWorkouts[this.currentExerciseIndex];
        
        // Update exercise details
        document.getElementById('exerciseName').textContent = exercise.name;
        document.getElementById('currentSet').textContent = this.currentSet;
        document.getElementById('totalSets').textContent = exercise.sets;
        document.getElementById('detailSets').textContent = exercise.sets;
        document.getElementById('detailTarget').textContent = exercise.target;
        document.getElementById('detailType').textContent = exercise.type === 'time' ? 'Timed' : 'Reps';
        
        // Update target label
        const targetLabel = document.getElementById('targetLabel');
        targetLabel.textContent = exercise.type === 'time' ? 'Target Time' : 'Target Reps';

        // Show/hide timer section
        const timerSection = document.getElementById('timerSection');
        if (exercise.type === 'time') {
            timerSection.classList.remove('hidden');
            this.remainingTime = exercise.target;
            document.getElementById('timerValue').textContent = this.remainingTime;
            document.getElementById('timerProgress').style.width = '100%';
        } else {
            timerSection.classList.add('hidden');
        }

        // Update action button
        this.updateActionButton(exercise);

        // Highlight current exercise in plan
        this.highlightCurrentExercise();
    }

    updateActionButton(exercise) {
    console.log('=== UPDATE ACTION BUTTON ===');
    console.log('Exercise type:', exercise.type);
    console.log('Current set:', this.currentSet);
    console.log('Timer running?', !!this.timerInterval);
    
    const actionBtn = document.getElementById('actionBtn');
    const actionText = document.getElementById('actionText');
    
    if (exercise.type === 'time') {
        // For timer exercises, show "Start Timer" unless timer is already running
        if (!this.timerInterval) {
            console.log('Setting button to: Start Timer');
            actionText.textContent = 'Start Timer';
            actionBtn.style.background = 'var(--primary-color)';
        } else {
            console.log('Timer is running, setting button to: Running...');
            actionText.textContent = 'Running...';
            actionBtn.style.background = 'var(--primary-color)';
            actionBtn.disabled = true;
        }
    } else {
        console.log('Non-timer exercise, setting button to: Set', this.currentSet, 'Completed');
        actionText.textContent = `Set ${this.currentSet} Completed`;
        actionBtn.style.background = 'var(--success-color)';
        actionBtn.disabled = false;
    }
}

    highlightCurrentExercise() {
        // Remove highlight from all exercises
        document.querySelectorAll('.workout-plan-item').forEach(item => {
            item.classList.remove('completed', 'current');
        });
        
        // Highlight completed exercises
        for (let i = 0; i < this.currentExerciseIndex; i++) {
            const completedItem = document.getElementById(`workoutPlan-${i}`);
            if (completedItem) {
                completedItem.classList.add('completed');
            }
        }
        
        // Highlight current exercise
        const currentItem = document.getElementById(`workoutPlan-${this.currentExerciseIndex}`);
        if (currentItem) {
            currentItem.classList.add('current');
        }
    }

    handleAction() {
    console.log('=== HANDLE ACTION START ===');
    const currentExercise = this.currentWorkouts[this.currentExerciseIndex];
    
    if (currentExercise.type === 'time') {
        // For timer exercises, always start timer when button is clicked
        // (except when timer is already running)
        if (!this.timerInterval) {
            console.log('Starting timer...');
            this.startTimer();
            return;
        }
        console.log('Timer is already running');
    }
    
    console.log('Completing set...');
    this.completeSet();
}

    startTimer() {
    console.log('=== START TIMER ===');
    const currentExercise = this.currentWorkouts[this.currentExerciseIndex];
    console.log('Timer target:', currentExercise.target, 'seconds');
    console.log('Current exercise index:', this.currentExerciseIndex);
    console.log('Exercise name:', currentExercise.name);
    console.log('Current set when starting timer:', this.currentSet);
    
    this.remainingTime = currentExercise.target;
    console.log('Remaining time set to:', this.remainingTime);
    
    document.getElementById('actionBtn').disabled = true;
    document.getElementById('actionText').textContent = 'Running...';
    console.log('Button disabled and text changed to "Running..."');
    
    this.timerInterval = setInterval(() => {
        this.remainingTime--;
        console.log('Timer tick - Remaining:', this.remainingTime, 'seconds');
        document.getElementById('timerValue').textContent = this.remainingTime;
        
        const progress = (this.remainingTime / currentExercise.target) * 100;
        document.getElementById('timerProgress').style.width = `${progress}%`;
        
        if (this.remainingTime <= 0) {
            console.log('Timer reached 0 - stopping timer and completing set');
            this.stopTimer();
            this.completeSet();
        }
    }, 1000);
    
    console.log('Timer interval started');
}

    stopTimer() {
    console.log('=== STOP TIMER ===');
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        console.log('Timer interval cleared');
    }
    const actionBtn = document.getElementById('actionBtn');
    actionBtn.disabled = false;
    console.log('Button re-enabled');
}

    completeSet() {
    console.log('=== COMPLETE SET ===');
    const currentExercise = this.currentWorkouts[this.currentExerciseIndex];
    console.log('Before increment - Current Set:', this.currentSet);
    console.log('Current Exercise Sets:', currentExercise.sets);
    console.log('Current Exercise Name:', currentExercise.name);
    
    this.currentSet++;
    console.log('After increment - Current Set:', this.currentSet);
    
    if (this.currentSet > currentExercise.sets) {
        console.log('All sets completed for this exercise');
        console.log('Moving to next exercise...');
        this.currentExerciseIndex++;
        this.currentSet = 1;
        this.completedWorkouts++;
        console.log('New exercise index:', this.currentExerciseIndex);
        console.log('Completed workouts count:', this.completedWorkouts);
        this.updateProgressStats();
    }
    
    if (this.currentExerciseIndex < this.currentWorkouts.length) {
        console.log('Loading next exercise...');
        this.loadCurrentExercise();
    } else {
        console.log('All exercises completed!');
        this.completeWorkout();
    }
}

    completeWorkout() {
        document.getElementById('currentExercise').classList.add('hidden');
        document.getElementById('workoutComplete').classList.remove('hidden');
        
        // Mark all exercises as completed
        document.querySelectorAll('.workout-plan-item').forEach(item => {
            item.classList.add('completed');
        });
    }

    finishWorkout() {
    // Save workout data
    const workoutData = {
        date: new Date().toISOString(),
        day: this.currentDay,
        exercises: this.currentWorkouts,
        duration: this.calculateWorkoutDuration(),
        completed: true
    };
    
    this.storage.saveWorkout(workoutData);
    
    // Show fire burst animation and success message
    this.showWorkoutSuccess(workoutData);
}

// Add this new method for success animation
showWorkoutSuccess(workoutData) {
    // Add class to body to prevent scrolling
    document.body.classList.add('showing-animation');
    
    // 1. CREATE FIRE BURST ANIMATION
    const fireOverlay = document.createElement('div');
    fireOverlay.className = 'fire-burst-overlay';
    fireOverlay.id = 'fireOverlay';
    
    // Create fire center burst
    const fireCenter = document.createElement('div');
    fireCenter.className = 'fire-center';
    fireOverlay.appendChild(fireCenter);
    
    // Create flame particles with random trajectories
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const flame = document.createElement('div');
        flame.className = 'flame-particle';
        
        // Random starting position around center
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 30 + Math.random() * 70;
        const startX = Math.cos(angle) * distance;
        const startY = Math.sin(angle) * distance;
        
        // Random ending position (float outward)
        const endX = startX * 3 + (Math.random() - 0.5) * 100;
        const endY = startY * 3 + (Math.random() - 0.5) * 100;
        const rotation = Math.random() * 360;
        
        flame.style.left = `calc(50% + ${startX}px)`;
        flame.style.top = `calc(50% + ${startY}px)`;
        flame.style.setProperty('--tx', `${endX}px`);
        flame.style.setProperty('--ty', `${endY}px`);
        flame.style.setProperty('--r', `${rotation}deg`);
        flame.style.animationDelay = `${Math.random() * 0.5}s`;
        
        fireOverlay.appendChild(flame);
    }
    
    document.body.appendChild(fireOverlay);
    
    // 2. SHOW FIRE ANIMATION IMMEDIATELY
    fireOverlay.style.display = 'block';
    
    // 3. CREATE SUCCESS MESSAGE (YOUR PREMIUM VERSION)
    const successMessage = document.createElement('div');
    successMessage.className = 'workout-success-message';
    successMessage.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-fire"></i>
        </div>
        <div class="success-title">VICTORY ACHIEVED</div>
        <div class="success-message">You absolutely crushed your workout! 🔥</div>
        
        <div class="success-stats">
            <div class="stat">
                <span><i class="fas fa-calendar-day"></i> TRAINING DAY</span>
                <span>${this.currentDay.toUpperCase()}</span>
            </div>
            <div class="stat">
                <span><i class="fas fa-dumbbell"></i> EXERCISES</span>
                <span>${this.currentWorkouts.length}</span>
            </div>
            <div class="stat">
                <span><i class="fas fa-bullseye"></i> FOCUS AREA</span>
                <span>${this.planMapping[this.currentDay].toUpperCase()}</span>
            </div>
        </div>
        
        <button class="success-close-btn" id="closeSuccessBtn">
            <i class="fas fa-trophy"></i>
            CELEBRATE VICTORY
        </button>
    `;
    
    document.body.appendChild(successMessage);
    
    // 4. SHOW MESSAGE AFTER FIRE ANIMATION STARTS
    setTimeout(() => {
        successMessage.style.display = 'block';
        successMessage.style.animation = 'messageEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }, 500);
    
    // 5. HANDLE CLOSE BUTTON
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    closeSuccessBtn.addEventListener('click', () => {
        // Add fade out animation
        fireOverlay.style.opacity = '0';
        fireOverlay.style.transition = 'opacity 0.3s ease';
        
        successMessage.style.animation = 'messageEntrance 0.3s ease reverse forwards';
        
        setTimeout(() => {
            // Remove elements
            if (fireOverlay.parentNode) fireOverlay.parentNode.removeChild(fireOverlay);
            if (successMessage.parentNode) successMessage.parentNode.removeChild(successMessage);
            
            // Remove body class
            document.body.classList.remove('showing-animation');
            
            // Redirect to home page
            window.location.href = 'index.html';
        }, 300);
    });
    
    // 6. AUTO-CLOSE AFTER 5 SECONDS
    setTimeout(() => {
        if (fireOverlay.parentNode && successMessage.parentNode && document.body.classList.contains('showing-animation')) {
            closeSuccessBtn.click();
        }
    }, 5000);
}

    calculateWorkoutDuration() {
        // Simple duration calculation - you can enhance this
        return this.currentWorkouts.length * 5 * 60; // 5 minutes per exercise in seconds
    }
}

// Global instance
const workoutManager = new WorkoutManager();