// Add this at the top of plans.js
console.log('🔄 Plans.js loaded at:', new Date().toLocaleTimeString());

// Create global variable first
window.plansManager = null;

class PlansManager {
    constructor() {
        this.storage = new WorkoutStorage();
        this.selectedDay = 'Monday';
        this.planMapping = {
            'Monday': 'Arms + Shoulders + Chest',
            'Tuesday': 'Legs + Glutes', 
            'Wednesday': 'Rest',
            'Thursday': 'Abs + Core',
            'Friday': 'Back + Arms + Chest',
            'Saturday': 'Full Body',
            'Sunday': 'Rest'
        };
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    init() {
        console.log('🔧 Initializing PlansManager...');
        this.loadPlans();
        this.bindEvents();
        this.updateButtonText();
        this.setupDaysNavigation();
        window.plansManager = this; // Set global instance
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
        
        if (editButton) {
            if (plans.length > 0) {
                editButton.innerHTML = '<i class="fas fa-edit"></i> Modify Plans';
            } else {
                editButton.innerHTML = '<i class="fas fa-plus"></i> Add Plan';
            }
        }
    }

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Helper to safely bind events
        const safeBind = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`✅ Bound ${event} to #${id}`);
            } else {
                console.warn(`⚠️ Element #${id} not found`);
            }
        };
        
        // Bind main buttons
        safeBind('editPlanBtn', 'click', () => {
            console.log('📊 Current plans:', this.storage.getPlans());
            this.showCreatePlanModal();
        });
        
        safeBind('closeModal', 'click', () => this.closeModal());
        safeBind('saveAllWorkoutsBtn', 'click', () => this.saveAllWorkouts());
        safeBind('addNewWorkoutBtn', 'click', () => this.addNewWorkoutForm());
        safeBind('resetForm', 'click', () => this.resetForm());
        safeBind('closeForm', 'click', () => this.closeModal());

        // Day selection events
        document.querySelectorAll('input[name="selectedDay"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleDaySelection(e.target.value));
        });

        // Close modal when clicking outside
        const modal = document.getElementById('createPlanModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'createPlanModal') {
                    this.closeModal();
                }
            });
        }
        
        // Add success animation to save all workouts button
        const saveAllBtn = document.getElementById('saveAllWorkoutsBtn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => {
                setTimeout(() => {
                    saveAllBtn.classList.add('success-animation');
                    setTimeout(() => saveAllBtn.classList.remove('success-animation'), 1000);
                }, 100);
            });
        }
    }

    handleDaySelection(selectedDay) {
        console.log('📅 Day selected:', selectedDay);
        this.selectedDay = selectedDay;
        this.displayDayWorkouts(selectedDay);
    }

    displayDayWorkouts(dayName) {
        console.log('📋 Displaying workouts for:', dayName);
        
        const focus = this.planMapping[dayName];
        const existingWorkoutsSection = document.getElementById('existingWorkoutsSection');
        const addWorkoutSection = document.getElementById('addWorkoutSection');
        const restDayMessage = document.getElementById('restDayMessage');

        // Reset all sections
        if (existingWorkoutsSection) existingWorkoutsSection.classList.add('hidden');
        if (addWorkoutSection) addWorkoutSection.classList.add('hidden');
        if (restDayMessage) restDayMessage.classList.add('hidden');

        if (focus === 'Rest') {
            console.log('😴 Rest day selected');
            if (restDayMessage) restDayMessage.classList.remove('hidden');
            return;
        }

        // Get existing workouts for this day
        const existingWorkouts = this.getWorkoutsForDay(dayName);
        console.log('💪 Existing workouts:', existingWorkouts);
        
        if (existingWorkouts.length > 0 && existingWorkoutsSection) {
            existingWorkoutsSection.classList.remove('hidden');
            this.displayExistingWorkouts(dayName, existingWorkouts);
        }

        // Always show add workout section for non-rest days
        if (addWorkoutSection) {
            addWorkoutSection.classList.remove('hidden');
            
            // Clear and add initial workout form
            const container = document.getElementById('workoutFormsContainer');
            if (container) {
                container.innerHTML = '';
                this.addNewWorkoutForm();
            }
        }
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
        if (!existingWorkoutsList) return;
        
        if (workouts.length === 0) {
            existingWorkoutsList.innerHTML = '<p class="no-workouts">No workouts added for this day</p>';
            return;
        }

        existingWorkoutsList.innerHTML = workouts.map((workout, index) => `
            <div class="existing-workout-item" data-index="${index}">
                <div class="workout-info">
                    <div class="workout-name">${workout.name}</div>
                    <div class="workout-details">
                        ${workout.sets} sets × ${workout.target} ${workout.type === 'time' ? 'seconds' : 'reps'}
                    </div>
                </div>
                <div class="workout-actions">
                    <button type="button" class="update-workout" onclick="if(window.plansManager) window.plansManager.updateWorkout('${dayName}', ${index})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button type="button" class="remove-workout" onclick="if(window.plansManager) window.plansManager.removeWorkout('${dayName}', ${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Add new workout form
    addNewWorkoutForm() {
        const container = document.getElementById('workoutFormsContainer');
        if (!container) {
            console.error('❌ workoutFormsContainer not found!');
            return;
        }
        
        const formIndex = container.children.length;
        
        const workoutFormHTML = `
            <div class="workout-form-item" id="workoutForm-${formIndex}">
                ${formIndex > 0 ? `
                    <button type="button" class="remove-workout-form" onclick="if(window.plansManager) window.plansManager.removeWorkoutForm(${formIndex})">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
                <div class="workout-form">
                    <div class="form-group">
                        <label>Workout Name</label>
                        <input type="text" class="workout-name-input form-control" 
                               placeholder="e.g., Bench Press, Squats" 
                               oninput="if(window.plansManager) window.plansManager.autoCapitalize(this)">
                    </div>
                    <div class="form-group">
                        <label>Sets</label>
                        <input type="number" class="workout-sets-input form-control" 
                               value="3" min="1" max="10">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <div class="type-toggle" id="typeToggle-${formIndex}">
                            <span class="toggle-option active" data-type="reps" onclick="if(window.plansManager) window.plansManager.setWorkoutTypeInForm(${formIndex}, 'reps')">Reps</span>
                            <span class="toggle-option" data-type="time" onclick="if(window.plansManager) window.plansManager.setWorkoutTypeInForm(${formIndex}, 'time')">Time</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="target-label" id="targetLabel-${formIndex}">Target Reps</label>
                        <input type="number" class="workout-target-input form-control" 
                               value="10" min="1">
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', workoutFormHTML);
    }

    // Remove workout form
    removeWorkoutForm(index) {
        const formElement = document.getElementById(`workoutForm-${index}`);
        const container = document.getElementById('workoutFormsContainer');
        if (formElement && container && container.children.length > 1) {
            formElement.remove();
        }
    }

    // Set workout type in specific form
    setWorkoutTypeInForm(formIndex, type) {
        const formElement = document.getElementById(`workoutForm-${formIndex}`);
        if (formElement) {
            const toggleOptions = formElement.querySelectorAll('.toggle-option');
            const targetLabel = formElement.querySelector(`#targetLabel-${formIndex}`);
            
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            const activeOption = formElement.querySelector(`.toggle-option[data-type="${type}"]`);
            if (activeOption) activeOption.classList.add('active');
            
            if (targetLabel) {
                targetLabel.textContent = type === 'time' ? 'Target Seconds' : 'Target Reps';
            }
        }
    }
    
    updateWorkout(dayName, workoutIndex) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('✅ Edit clicked for:', dayName, 'workout index:', workoutIndex);
    
    const plans = this.storage.getPlans();
    const mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
    
    if (!mainPlan) {
        console.log('❌ No plan found');
        return false;
    }
    
    const day = mainPlan.days.find(d => d.name === dayName);
    if (!day || !day.exercises[workoutIndex]) {
        console.log('❌ Workout not found');
        return false;
    }
    
    const workout = day.exercises[workoutIndex];
    
    console.log('📋 Current workout details:', workout);
    
    // Clear existing forms and add ONE form with the workout data
    const container = document.getElementById('workoutFormsContainer');
    if (!container) {
        console.error('❌ No workout forms container');
        return false;
    }
    container.innerHTML = '';
    
    // Create a SINGLE form with the workout data
    const formIndex = 0;
    const workoutFormHTML = `
        <div class="workout-form-item" id="workoutForm-${formIndex}">
            <div class="workout-form">
                <div class="form-group">
                    <label>Workout Name</label>
                    <input type="text" class="workout-name-input form-control" 
                           value="${workout.name}" placeholder="e.g., Bench Press, Squats" 
                           oninput="if(window.plansManager) window.plansManager.autoCapitalize(this)">
                </div>
                <div class="form-group">
                    <label>Sets</label>
                    <input type="number" class="workout-sets-input form-control" 
                           value="${workout.sets}" min="1" max="10">
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <div class="type-toggle">
                        <span class="toggle-option ${workout.type === 'reps' ? 'active' : ''}" 
                              data-type="reps" onclick="if(window.plansManager) window.plansManager.setWorkoutTypeInForm(${formIndex}, 'reps')">Reps</span>
                        <span class="toggle-option ${workout.type === 'time' ? 'active' : ''}" 
                              data-type="time" onclick="if(window.plansManager) window.plansManager.setWorkoutTypeInForm(${formIndex}, 'time')">Time</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="target-label-${formIndex}">Target ${workout.type === 'time' ? 'Seconds' : 'Reps'}</label>
                    <input type="number" class="workout-target-input form-control" 
                           value="${workout.target}" min="1">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', workoutFormHTML);
    
    // HIDE the "Add Another Workout" button when in edit mode
    const addAnotherBtn = document.getElementById('addNewWorkoutBtn');
    if (addAnotherBtn) {
        addAnotherBtn.style.display = 'none';
    }
    
    // Change save button to update mode
    const saveBtn = document.getElementById('saveAllWorkoutsBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Workout';
        saveBtn.dataset.mode = 'update';
        saveBtn.dataset.day = dayName;
        saveBtn.dataset.index = workoutIndex;
    }
    
    // Show form section
    const addWorkoutSection = document.getElementById('addWorkoutSection');
    if (addWorkoutSection) {
        addWorkoutSection.classList.remove('hidden');
    }
    
    console.log('✅ Form updated for single workout edit');
    return false;
}

    // Save all workouts
    // Save all workouts - FIXED VERSION (appends instead of replaces)
saveAllWorkouts() {
    const container = document.getElementById('workoutFormsContainer');
    if (!container) {
        console.error('❌ No workout forms container');
        return;
    }
    
    const workoutForms = container.querySelectorAll('.workout-form-item');
    const newWorkouts = [];
    
    // Validate and collect all NEW workouts from the form
    for (let i = 0; i < workoutForms.length; i++) {
        const form = workoutForms[i];
        const nameInput = form.querySelector('.workout-name-input');
        const setsInput = form.querySelector('.workout-sets-input');
        const targetInput = form.querySelector('.workout-target-input');
        const typeOption = form.querySelector('.toggle-option.active');
        
        if (!nameInput || !setsInput || !targetInput || !typeOption) continue;
        
        const name = nameInput.value.trim();
        const sets = parseInt(setsInput.value) || 3;
        const target = parseInt(targetInput.value) || 10;
        const type = typeOption.dataset.type || 'reps';
        
        if (!name) {
            this.showPremiumMessage('removal', 'Validation Error', `Please enter a name for workout #${i + 1}`);
            nameInput.focus();
            return;
        }
        
        newWorkouts.push({
            name: this.autoCapitalizeText(name),
            sets: sets,
            target: target,
            type: type
        });
    }
    
    if (newWorkouts.length === 0) {
        this.showPremiumMessage('removal', 'Validation Error', 'Please add at least one workout!');
        return;
    }
    
    console.log('💪 New workouts to save:', newWorkouts);
    
    // Get existing plan
    const plans = this.storage.getPlans();
    let mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
    
    if (!mainPlan) {
        console.log('📋 Creating new plan');
        mainPlan = {
            name: "7-Days Muscle Building Plan",
            days: this.createEmptyWeek()
        };
    }
    
    // Check if we're in update mode
    const saveBtn = document.getElementById('saveAllWorkoutsBtn');
    const isUpdateMode = saveBtn && saveBtn.dataset.mode === 'update';
    
    // Find the selected day
    const dayIndex = mainPlan.days.findIndex(d => d.name === this.selectedDay);
    if (dayIndex === -1) {
        console.error('❌ Day not found:', this.selectedDay);
        return;
    }
    
    if (isUpdateMode) {
        // UPDATE MODE: Replace specific workout
        const dayName = saveBtn.dataset.day;
        const workoutIndex = parseInt(saveBtn.dataset.index);
        
        console.log(`🔄 Updating workout at index ${workoutIndex} on ${dayName}`);
        
        // Find the correct day
        const updateDayIndex = mainPlan.days.findIndex(d => d.name === dayName);
        if (updateDayIndex !== -1 && mainPlan.days[updateDayIndex].exercises[workoutIndex]) {
            // Replace only the specific workout being edited
            mainPlan.days[updateDayIndex].exercises[workoutIndex] = newWorkouts[0];
            
            this.showPremiumMessage('update', 'Workout Updated', 
                `"${newWorkouts[0].name}" has been successfully updated.`);
        }
        
        // Reset update mode
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save All Workouts';
            delete saveBtn.dataset.mode;
            delete saveBtn.dataset.day;
            delete saveBtn.dataset.index;
        }
    } else {
        // ADD MODE: Append new workouts to existing ones
        console.log('➕ ADD MODE: Appending workouts');
        
        // Get existing workouts for this day
        const existingWorkouts = mainPlan.days[dayIndex].exercises || [];
        console.log('📋 Existing workouts:', existingWorkouts);
        
        // Combine existing workouts with new ones (APPEND, not replace)
        mainPlan.days[dayIndex].exercises = [...existingWorkouts, ...newWorkouts];
        
        console.log('✅ Combined workouts:', mainPlan.days[dayIndex].exercises);
        
        this.showPremiumMessage('success', 'Workout Saved', 
            `${newWorkouts.length} new workout(s) have been added to ${this.selectedDay}.`);
    }
    
    // Save the updated plan
    if (plans.find(p => p.name === "7-Days Muscle Building Plan")) {
        this.storage.updatePlan(mainPlan);
    } else {
        this.storage.savePlan(mainPlan);
    }
    
    // Add tada animation to the workout display
    const workoutDisplay = document.getElementById('dayWorkoutDisplay');
    if (workoutDisplay) {
        workoutDisplay.classList.add('saved-item');
        setTimeout(() => workoutDisplay.classList.remove('saved-item'), 1000);
    }
    
    // Close modal and refresh displays
    this.closeModal();
    this.displayDayWorkouts(this.selectedDay);
    this.displayDayWorkout(this.selectedDay);
    this.updateButtonText();
}

    resetForm() {
    const container = document.getElementById('workoutFormsContainer');
    if (container) {
        container.innerHTML = '';
        this.addNewWorkoutForm();
    }
    
    document.querySelectorAll('input[name="selectedDay"]').forEach(radio => {
        radio.checked = false;
    });
    
    const existingWorkoutsSection = document.getElementById('existingWorkoutsSection');
    const addWorkoutSection = document.getElementById('addWorkoutSection');
    const restDayMessage = document.getElementById('restDayMessage');
    
    if (existingWorkoutsSection) existingWorkoutsSection.classList.add('hidden');
    if (addWorkoutSection) addWorkoutSection.classList.add('hidden');
    if (restDayMessage) restDayMessage.classList.add('hidden');
    
    // Show the "Add Another Workout" button again
    const addAnotherBtn = document.getElementById('addNewWorkoutBtn');
    if (addAnotherBtn) {
        addAnotherBtn.style.display = '';
    }
    
    // Reset update mode if any
    const saveBtn = document.getElementById('saveAllWorkoutsBtn');
    if (saveBtn && saveBtn.dataset.mode === 'update') {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save All Workouts';
        delete saveBtn.dataset.mode;
        delete saveBtn.dataset.day;
        delete saveBtn.dataset.index;
    }
}

    showCreatePlanModal() {
        const modal = document.getElementById('createPlanModal');
        if (modal) {
            modal.classList.add('show');
            this.resetForm();
        }
    }

    closeModal() {
        const modal = document.getElementById('createPlanModal');
        if (modal) {
            modal.classList.remove('show');
        }
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
        const dayWorkoutDisplay = document.getElementById('dayWorkoutDisplay');
        if (!dayWorkoutDisplay) return;

        const plans = this.storage.getPlans();

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
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        let text = input.value;
        let result = '';
        let capitalizeNext = true;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (capitalizeNext && /[a-zA-Z]/.test(char)) {
                result += char.toUpperCase();
                capitalizeNext = false;
            } else {
                result += char.toLowerCase();
            }
            
            if (char === ' ') {
                capitalizeNext = true;
            }
        }
        
        input.value = result;
        input.setSelectionRange(start, end);
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

    // Premium Message Methods
    showPremiumMessage(type, title, message) {
        // Remove any existing message
        const existingMessage = document.querySelector('.premium-message');
        if (existingMessage) {
            existingMessage.classList.add('hiding');
            setTimeout(() => existingMessage.remove(), 500);
        }
        
        const icons = {
            success: 'fas fa-check-circle',
            update: 'fas fa-sync-alt',
            removal: 'fas fa-trash-alt'
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

    async showPremiumConfirm(message) {
        return new Promise((resolve) => {
            const confirmHTML = `
                <div class="premium-confirm-overlay">
                    <div class="premium-confirm-box">
                        <div class="premium-confirm-header">
                            <i class="premium-confirm-icon fas fa-exclamation-triangle"></i>
                            <h3 class="premium-confirm-title">Confirm Removal</h3>
                        </div>
                        <div class="premium-confirm-content">
                            ${message}
                        </div>
                        <div class="premium-confirm-actions">
                            <button type="button" class="premium-confirm-btn cancel">Cancel</button>
                            <button type="button" class="premium-confirm-btn confirm">Remove</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', confirmHTML);
            
            const overlay = document.querySelector('.premium-confirm-overlay');
            const cancelBtn = overlay.querySelector('.premium-confirm-btn.cancel');
            const confirmBtn = overlay.querySelector('.premium-confirm-btn.confirm');
            
            const removeOverlay = () => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            };
            
            cancelBtn.addEventListener('click', () => {
                removeOverlay();
                resolve(false);
            });
            
            confirmBtn.addEventListener('click', () => {
                removeOverlay();
                resolve(true);
            });
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    removeOverlay();
                    resolve(false);
                }
            });
        });
    }

    async removeWorkout(dayName, workoutIndex) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const workout = this.getWorkoutsForDay(dayName)[workoutIndex];
        if (!workout) return false;
        
        const confirmed = await this.showPremiumConfirm(
            `Are you sure you want to remove <strong>"${workout.name}"</strong>?<br><br>
            <small>This workout has ${workout.sets} sets of ${workout.target} ${workout.type === 'time' ? 'seconds' : 'reps'}.<br>
            This action cannot be undone.</small>`
        );
        
        if (confirmed) {
            const plans = this.storage.getPlans();
            const mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
            
            if (mainPlan) {
                const day = mainPlan.days.find(d => d.name === dayName);
                if (day && day.exercises) {
                    const removedWorkout = day.exercises[workoutIndex];
                    day.exercises.splice(workoutIndex, 1);
                    this.storage.updatePlan(mainPlan);
                    
                    // Show removal success message
                    this.showPremiumMessage('removal', 'Workout Removed', 
                        `"${removedWorkout.name}" has been successfully removed from ${dayName}.`);
                    
                    this.displayDayWorkouts(dayName);
                    this.displayDayWorkout(this.selectedDay);
                }
            }
        }
        return false;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM loaded, creating PlansManager...');
    const manager = new PlansManager();
    window.plansManager = manager;
    console.log('✅ PlansManager initialized globally');
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('🏁 DOM already loaded, creating PlansManager immediately...');
    const manager = new PlansManager();
    window.plansManager = manager;
}