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
        this.updateWorkoutReminder(); // NEW: Added workout reminder
        
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    // NEW: Added workout reminder method
    updateWorkoutReminder() {
        const settings = JSON.parse(localStorage.getItem('workoutTracker_settings') || '{}');
        const userName = settings.userName || 'Fitness Enthusiast';
        const reminderElement = document.getElementById('userWorkoutReminder');
        
        if (reminderElement) {
            reminderElement.textContent = `Let's go ${userName}! Time to crush your workout!`;
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
            <div class="workout-plan-item" id="workoutPlan-${index}">
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
            setTimeout(() => {
                progressFill.style.animation = 'pulse 1s ease-in-out';
            }, 800);
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
        const actionBtn = document.getElementById('actionBtn');
        const actionText = document.getElementById('actionText');
        
        if (exercise.type === 'time') {
            if (this.currentSet === 1) {
                actionText.textContent = 'Start Timer';
                actionBtn.style.background = 'var(--primary-color)';
            } else {
                actionText.textContent = `Set ${this.currentSet} Completed`;
                actionBtn.style.background = 'var(--success-color)';
            }
        } else {
            actionText.textContent = `Set ${this.currentSet} Completed`;
            actionBtn.style.background = 'var(--success-color)';
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
        const currentExercise = this.currentWorkouts[this.currentExerciseIndex];
        
        if (currentExercise.type === 'time') {
            if (this.currentSet === 1 && !this.timerInterval) {
                this.startTimer();
                return;
            }
        }
        
        this.completeSet();
    }

    startTimer() {
        const currentExercise = this.currentWorkouts[this.currentExerciseIndex];
        this.remainingTime = currentExercise.target;
        
        document.getElementById('actionBtn').disabled = true;
        document.getElementById('actionText').textContent = 'Running...';
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            document.getElementById('timerValue').textContent = this.remainingTime;
            
            const progress = (this.remainingTime / currentExercise.target) * 100;
            document.getElementById('timerProgress').style.width = `${progress}%`;
            
            if (this.remainingTime <= 0) {
                this.stopTimer();
                this.completeSet();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        document.getElementById('actionBtn').disabled = false;
    }

    completeSet() {
        const currentExercise = this.currentWorkouts[this.currentExerciseIndex];
        
        this.currentSet++;
        
        if (this.currentSet > currentExercise.sets) {
            // Move to next exercise
            this.currentExerciseIndex++;
            this.currentSet = 1;
            this.completedWorkouts++;
            this.updateProgressStats();
        }
        
        if (this.currentExerciseIndex < this.currentWorkouts.length) {
            this.loadCurrentExercise();
        } else {
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
            duration: this.calculateWorkoutDuration(), // You can implement this
            completed: true
        };
        
        this.storage.saveWorkout(workoutData);
        
        // Show success message and redirect
        alert('Workout completed successfully! 🎉');
        window.location.href = 'index.html';
    }

    calculateWorkoutDuration() {
        // Simple duration calculation - you can enhance this
        return this.currentWorkouts.length * 5 * 60; // 5 minutes per exercise in seconds
    }
}

// Global instance
const workoutManager = new WorkoutManager();