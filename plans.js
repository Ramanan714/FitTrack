class PlansManager {
    constructor() {
        this.storage = new WorkoutStorage();
        this.selectedDay = 'Monday';
        this.currentWorkoutType = 'reps';
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
        this.loadPlans();
        this.bindEvents();
        this.updateButtonText();
        this.setupDaysNavigation();
    }

    loadPlans() {
        const plans = this.storage.getPlans();
        if (plans.length > 0) {
            this.displayDayWorkout(this.selectedDay);
        }
    }

    updateButtonText() {
        const plans = this.storage.getPlans();
        const editButton = document.getElementById('editPlanBtn');
        
        if (plans.length > 0) {
            editButton.innerHTML = '<i class="fas fa-edit"></i> Modify Plans';
        } else {
            editButton.innerHTML = '<i class="fas fa-plus"></i> Add Plan';
        }
    }

    bindEvents() {
        document.getElementById('editPlanBtn').addEventListener('click', () => this.showCreatePlanModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('saveWorkoutBtn').addEventListener('click', () => this.saveWorkout());
        document.getElementById('addNewWorkoutBtn').addEventListener('click', () => this.addNewWorkout());
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());
        document.getElementById('closeForm').addEventListener('click', () => this.closeModal());

        // Day selection events
        document.querySelectorAll('input[name="selectedDay"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleDaySelection(e.target.value));
        });

        // Close modal when clicking outside
        document.getElementById('createPlanModal').addEventListener('click', (e) => {
            if (e.target.id === 'createPlanModal') {
                this.closeModal();
            }
        });
    }

    handleDaySelection(selectedDay) {
        this.selectedDay = selectedDay;
        this.displayDayWorkouts(selectedDay);
    }

    displayDayWorkouts(dayName) {
        const focus = this.planMapping[dayName];
        const existingWorkoutsSection = document.getElementById('existingWorkoutsSection');
        const addWorkoutSection = document.getElementById('addWorkoutSection');
        const restDayMessage = document.getElementById('restDayMessage');

        // Reset all sections
        existingWorkoutsSection.classList.add('hidden');
        addWorkoutSection.classList.add('hidden');
        restDayMessage.classList.add('hidden');

        if (focus === 'Rest') {
            restDayMessage.classList.remove('hidden');
            return;
        }

        // Get existing workouts for this day
        const existingWorkouts = this.getWorkoutsForDay(dayName);
        
        if (existingWorkouts.length > 0) {
            existingWorkoutsSection.classList.remove('hidden');
            this.displayExistingWorkouts(dayName, existingWorkouts);
        }

        // Always show add workout section for non-rest days
        addWorkoutSection.classList.remove('hidden');
        this.resetWorkoutForm();
    }

    getWorkoutsForDay(dayName) {
        const plans = this.storage.getPlans();
        if (plans.length === 0) return [];

        const mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
        if (!mainPlan) return [];

        const day = mainPlan.days.find(d => d.name === dayName);
        return day ? day.exercises : [];
    }

    displayExistingWorkouts(dayName, workouts) {
        const existingWorkoutsList = document.getElementById('existingWorkoutsList');
        
        if (workouts.length === 0) {
            existingWorkoutsList.innerHTML = '<p class="no-workouts">No workouts added for this day</p>';
            return;
        }

        existingWorkoutsList.innerHTML = workouts.map((workout, index) => `
            <div class="existing-workout-item">
                <div class="workout-info">
                    <div class="workout-name">${workout.name}</div>
                    <div class="workout-details">
                        ${workout.sets} sets × ${workout.target} ${workout.type === 'time' ? 'seconds' : 'reps'}
                    </div>
                </div>
                <div class="workout-actions">
                    <button class="remove-workout" onclick="plansManager.removeWorkout('${dayName}', ${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    removeWorkout(dayName, workoutIndex) {
        if (confirm('Are you sure you want to remove this workout?')) {
            const plans = this.storage.getPlans();
            const mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
            
            if (mainPlan) {
                const day = mainPlan.days.find(d => d.name === dayName);
                if (day && day.exercises) {
                    day.exercises.splice(workoutIndex, 1);
                    this.storage.updatePlan(mainPlan);
                    this.displayDayWorkouts(dayName);
                    this.displayDayWorkout(this.selectedDay); // Update main display
                }
            }
        }
    }

    setWorkoutType(type) {
        this.currentWorkoutType = type;
        const toggleOptions = document.querySelectorAll('.toggle-option');
        const targetLabel = document.getElementById('targetLabel');
        const workoutTarget = document.getElementById('workoutTarget');

        toggleOptions.forEach(opt => opt.classList.remove('active'));
        document.querySelector(`.toggle-option[data-type="${type}"]`).classList.add('active');

        if (type === 'time') {
            targetLabel.textContent = 'Target Seconds';
            workoutTarget.placeholder = 'Seconds';
        } else {
            targetLabel.textContent = 'Target Reps';
            workoutTarget.placeholder = 'Reps';
        }
    }

    saveWorkout() {
        const workoutName = document.getElementById('workoutName').value.trim();
        const workoutSets = parseInt(document.getElementById('workoutSets').value) || 3;
        const workoutTarget = parseInt(document.getElementById('workoutTarget').value) || 10;

        if (!workoutName) {
            alert('Please enter a workout name!');
            return;
        }

        const newWorkout = {
            name: this.autoCapitalizeText(workoutName),
            sets: workoutSets,
            target: workoutTarget,
            type: this.currentWorkoutType
        };

        // Get or create main plan
        const plans = this.storage.getPlans();
        let mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");

        if (!mainPlan) {
            mainPlan = {
                name: "7-Days Muscle Building Plan",
                days: this.createEmptyWeek()
            };
        }

        // Add workout to selected day
        const dayIndex = mainPlan.days.findIndex(d => d.name === this.selectedDay);
        if (dayIndex !== -1) {
            if (!mainPlan.days[dayIndex].exercises) {
                mainPlan.days[dayIndex].exercises = [];
            }
            mainPlan.days[dayIndex].exercises.push(newWorkout);
        }

        // Save plan
        if (plans.find(p => p.name === "7-Days Muscle Building Plan")) {
            this.storage.updatePlan(mainPlan);
        } else {
            this.storage.savePlan(mainPlan);
        }

        // Show success and reset form
        alert('Workout saved successfully!');
        this.resetWorkoutForm();
        this.displayDayWorkouts(this.selectedDay);
        this.displayDayWorkout(this.selectedDay);
        this.updateButtonText();

        // Show "Add Another" button
        document.getElementById('addNewWorkoutBtn').classList.remove('hidden');
    }

    addNewWorkout() {
        this.resetWorkoutForm();
        document.getElementById('addNewWorkoutBtn').classList.add('hidden');
    }

    resetWorkoutForm() {
        document.getElementById('workoutName').value = '';
        document.getElementById('workoutSets').value = '3';
        document.getElementById('workoutTarget').value = '10';
        this.setWorkoutType('reps');
    }

    resetForm() {
        this.resetWorkoutForm();
        document.querySelectorAll('input[name="selectedDay"]').forEach(radio => {
            radio.checked = false;
        });
        document.getElementById('existingWorkoutsSection').classList.add('hidden');
        document.getElementById('addWorkoutSection').classList.add('hidden');
        document.getElementById('restDayMessage').classList.add('hidden');
        document.getElementById('addNewWorkoutBtn').classList.add('hidden');
    }

    showCreatePlanModal() {
        document.getElementById('createPlanModal').classList.add('show');
        this.resetForm();
    }

    closeModal() {
        document.getElementById('createPlanModal').classList.remove('show');
    }

    setupDaysNavigation() {
        const dayButtons = document.querySelectorAll('.day-btn');
        dayButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedDay = btn.dataset.day;
                this.updateActiveDay();
                this.displayDayWorkout(this.selectedDay);
            });
        });
        this.updateActiveDay();
    }

    updateActiveDay() {
        const dayButtons = document.querySelectorAll('.day-btn');
        dayButtons.forEach(btn => {
            if (btn.dataset.day === this.selectedDay) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    displayDayWorkout(dayName) {
        const plans = this.storage.getPlans();
        const dayWorkoutDisplay = document.getElementById('dayWorkoutDisplay');

        if (plans.length === 0) {
            dayWorkoutDisplay.innerHTML = `
                <div class="no-workout-message">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Workout Plans Yet</h3>
                    <p>Click "Add Plan" to create your first workout plan!</p>
                </div>
            `;
            return;
        }

        const focus = this.planMapping[dayName];
        const workouts = this.getWorkoutsForDay(dayName);

        if (focus === 'Rest' || workouts.length === 0) {
            dayWorkoutDisplay.innerHTML = `
                <div class="workout-header">
                    <h2 class="day-title">${dayName}</h2>
                    <p class="day-focus">${focus}</p>
                </div>
                <div class="rest-day-message">
                    <i class="fas fa-bed"></i>
                    <h3>${focus === 'Rest' ? 'Rest Day' : 'No Workouts'}</h3>
                    <p>${focus === 'Rest' ? 'Enjoy your recovery day! Your muscles grow when you rest.' : 'No workouts added for this day yet.'}</p>
                </div>
            `;
        } else {
            dayWorkoutDisplay.innerHTML = `
                <div class="workout-header">
                    <h2 class="day-title">${dayName}</h2>
                    <p class="day-focus">${focus}</p>
                </div>
                <div class="exercises-container">
                    ${workouts.map((workout, index) => `
                        <div class="exercise-card">
                            <div class="exercise-name">${workout.name}</div>
                            <div class="exercise-details">
                                <div class="exercise-detail">
                                    <div class="detail-label">Sets</div>
                                    <div class="detail-value">${workout.sets}</div>
                                </div>
                                <div class="exercise-detail">
                                    <div class="detail-label">Target</div>
                                    <div class="detail-value">${workout.target} ${workout.type === 'time' ? 'sec' : 'reps'}</div>
                                </div>
                                <div class="exercise-detail">
                                    <div class="detail-label">Type</div>
                                    <div class="detail-value">${workout.type === 'time' ? 'Timed' : 'Reps'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    autoCapitalize(input) {
        input.value = this.autoCapitalizeText(input.value);
    }

    autoCapitalizeText(text) {
        const words = text.split(' ');
        const capitalizedWords = words.map(word => {
            if (word.length > 0) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word;
        });
        return capitalizedWords.join(' ');
    }

    createEmptyWeek() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => ({
            name: day,
            exercises: []
        }));
    }
}

// Global instance
const plansManager = new PlansManager();