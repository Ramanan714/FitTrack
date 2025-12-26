class ProfileManager {
    constructor() {
        this.storage = new WorkoutStorage();
        this.profileData = this.loadProfileData();
        this.init();
    }

    init() {
        this.loadProfile();
        this.updateDateTime();
        this.updateWorkoutStatus();
        this.loadQuickStats();
        this.bindEvents();
        this.setupModals();
        
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

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

    saveProfileData() {
        this.profileData.updatedAt = new Date().toISOString();
        if (!this.profileData.createdAt) {
            this.profileData.createdAt = this.profileData.updatedAt;
        }
        
        localStorage.setItem('workoutTracker_profile', JSON.stringify(this.profileData));
        
        // Also update old settings for backward compatibility
        const oldSettings = JSON.parse(localStorage.getItem('workoutTracker_settings') || '{}');
        oldSettings.userName = this.profileData.name;
        localStorage.setItem('workoutTracker_settings', JSON.stringify(oldSettings));
    }

    loadProfile() {
        this.loadProfileImage();
        this.loadProfileInfo();
    }

    loadProfileImage() {
        const profileAvatar = document.getElementById('profileAvatar');
        const profileFallback = document.querySelector('.profile-image-fallback');

        if (this.profileData && this.profileData.image) {
            profileAvatar.src = this.profileData.image;
            profileAvatar.style.display = 'block';
            profileFallback.style.display = 'none';
        } else {
            profileAvatar.style.display = 'none';
            profileFallback.style.display = 'flex';
        }
    }

    loadProfileInfo() {
        const profileName = document.getElementById('profileName');
        const profileTagline = document.getElementById('profileTagline');
        
        profileName.textContent = this.profileData.name || 'Your Name';
        profileTagline.textContent = this.profileData.tagline || '';
    }

    updateDateTime() {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[now.getDay()];
        
        const dateString = now.toLocaleDateString('en-GB');
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        document.getElementById('currentDay').textContent = dayName;
        document.getElementById('currentDate').textContent = dateString;
        document.getElementById('currentTime').textContent = timeString;
    }

    updateWorkoutStatus() {
        const workouts = this.storage.getWorkouts();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayWorkout = workouts.find(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);
            return workoutDate.getTime() === today.getTime() && workout.completed;
        });
        
        const statusMessage = document.getElementById('workoutStatusMessage');
        
        if (todayWorkout) {
            statusMessage.className = 'status-message completed';
            statusMessage.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Today's workout completed! 🎉
            `;
            this.showMessage('Workout completed today! Keep up the great work!', 'success');
        } else {
            const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
            const planMapping = {
                'Monday': 'Arms + Shoulders + Chest',
                'Tuesday': 'Legs + Glutes', 
                'Wednesday': 'Rest',
                'Thursday': 'Abs + Core',
                'Friday': 'Back + Arms + Chest',
                'Saturday': 'Full Body',
                'Sunday': 'Rest'
            };
            
            const focus = planMapping[dayName];
            
            if (focus === 'Rest') {
                statusMessage.className = 'status-message rest';
                statusMessage.innerHTML = `
                    <i class="fas fa-bed"></i>
                    Rest day today! Enjoy your recovery 💤
                `;
                this.showMessage('Rest day! Your muscles grow when you recover.', 'info');
            } else {
                statusMessage.className = 'status-message pending';
                statusMessage.innerHTML = `
                    <i class="fas fa-dumbbell"></i>
                    Today's workout: ${focus} - Ready to train? 💪
                `;
                this.showMessage(`Ready for ${focus} workout today! Let's crush it!`, 'warning');
            }
        }
    }

    loadQuickStats() {
        const workouts = this.storage.getWorkouts();
        const records = this.storage.getRecords();
        
        // Calculate streak
        const streak = this.calculateStreak(workouts);
        document.getElementById('streakValue').textContent = `${streak} days`;
        document.getElementById('streakDetailValue').textContent = streak;
        
        // Total workouts
        const totalWorkouts = workouts.filter(w => w.completed).length;
        document.getElementById('totalWorkoutsValue').textContent = totalWorkouts;
        document.getElementById('workoutsDetailValue').textContent = totalWorkouts;
        
        // Saved workouts
        const savedWorkoutsCount = this.getSavedWorkoutsCount();
        document.getElementById('savedWorkoutsValue').textContent = savedWorkoutsCount;
        this.displaySavedWorkouts();
        
        // Today's plan
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const planMapping = {
            'Monday': 'Arms + Shoulders + Chest',
            'Tuesday': 'Legs + Glutes', 
            'Wednesday': 'Rest',
            'Thursday': 'Abs + Core',
            'Friday': 'Back + Arms + Chest',
            'Saturday': 'Full Body',
            'Sunday': 'Rest'
        };
        document.getElementById('planValue').textContent = planMapping[dayName];
        this.displayTodaysPlan([], dayName);
        
        // Records count
        document.getElementById('recordsValue').textContent = `${records.length} records`;
        this.displayRecords(records);
    }

    getSavedWorkoutsCount() {
        const plans = this.storage.getPlans();
        const allExerciseNames = new Set();
        
        plans.forEach(plan => {
            if (plan.days && Array.isArray(plan.days)) {
                plan.days.forEach(day => {
                    if (day.exercises && Array.isArray(day.exercises)) {
                        day.exercises.forEach(exercise => {
                            if (exercise.name && typeof exercise.name === 'string') {
                                allExerciseNames.add(exercise.name.trim());
                            }
                        });
                    }
                });
            }
        });
        
        return allExerciseNames.size;
    }

    calculateStreak(workouts) {
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
        
        const workoutDays = [1, 2, 4, 5, 6]; // Mon, Tue, Thu, Fri, Sat
        
        let streak = 0;
        let currentDate = new Date(today);
        
        const todayDayOfWeek = today.getDay();
        if (workoutDays.includes(todayDayOfWeek)) {
            if (completedDates.has(today.getTime())) {
                streak++;
            }
        }
        
        currentDate = new Date(today.getTime() - oneDay);
        
        for (let i = 0; i < 30; i++) {
            const dayOfWeek = currentDate.getDay();
            const dateKey = currentDate.getTime();
            
            if (workoutDays.includes(dayOfWeek)) {
                if (completedDates.has(dateKey)) {
                    streak++;
                } else {
                    break;
                }
            }
            
            currentDate = new Date(currentDate.getTime() - oneDay);
        }
        
        return streak;
    }

    displaySavedWorkouts() {
        const list = document.getElementById('savedWorkoutsList');
        if (!list) return;
        
        const plans = this.storage.getPlans();
        const allExerciseNames = new Set();
        
        plans.forEach((plan) => {
            if (plan.days && Array.isArray(plan.days)) {
                plan.days.forEach((day) => {
                    if (day.exercises && Array.isArray(day.exercises)) {
                        day.exercises.forEach((exercise) => {
                            if (exercise.name && typeof exercise.name === 'string') {
                                allExerciseNames.add(exercise.name.trim());
                            }
                        });
                    }
                });
            }
        });
        
        const uniqueExerciseNames = Array.from(allExerciseNames).sort();
        
        if (uniqueExerciseNames.length === 0) {
            list.innerHTML = `
                <div class="no-workouts-message">
                    <i class="fas fa-dumbbell"></i>
                    <p>No exercises saved in your plans yet.</p>
                    <p>Go to Workout Plans to add exercises!</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = '';
        uniqueExerciseNames.forEach((name, index) => {
            const workoutItem = document.createElement('div');
            workoutItem.className = 'workout-item';
            workoutItem.style.animationDelay = `${index * 0.05}s`;
            workoutItem.innerHTML = `
                <div class="workout-name">${name}</div>
                <div class="workout-type">Saved Exercise</div>
            `;
            list.appendChild(workoutItem);
        });
    }

    displayTodaysPlan(plans, dayName) {
        const container = document.getElementById('todaysPlanDetail');
        if (!container) return;
        
        const planMapping = {
            'Monday': 'Arms + Shoulders + Chest',
            'Tuesday': 'Legs + Glutes', 
            'Wednesday': 'Rest',
            'Thursday': 'Abs + Core',
            'Friday': 'Back + Arms + Chest',
            'Saturday': 'Full Body',
            'Sunday': 'Rest'
        };
        
        const focus = planMapping[dayName];
        
        container.innerHTML = '';
        
        if (focus === 'Rest') {
            container.innerHTML = `
                <div class="rest-day-detail">
                    <div class="detail-icon">🛌</div>
                    <div class="detail-title">Rest Day</div>
                    <div class="detail-subtitle">${dayName}</div>
                    <p class="detail-description">Enjoy your recovery! Your body grows stronger when you rest.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="plan-detail">
                    <div class="detail-icon">🏋️‍♂️</div>
                    <div class="detail-title">${focus}</div>
                    <div class="detail-subtitle">${dayName} Workout</div>
                    <p class="detail-description">Focus on ${focus.toLowerCase()} today. Push yourself and stay hydrated!</p>
                    
                    <div class="workout-tips">
                        <h4><i class="fas fa-tips"></i> Pro Tips:</h4>
                        <ul>
                            <li>Warm up for 5-10 minutes</li>
                            <li>Maintain proper form</li>
                            <li>Rest 60-90 seconds between sets</li>
                            <li>Cool down with stretching</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }

    displayRecords(records) {
        const list = document.getElementById('recordsDetailList');
        if (!list) return;
        
        if (records.length === 0) {
            list.innerHTML = `
                <div class="no-records-message">
                    <i class="fas fa-trophy"></i>
                    <p>No records yet. Add some in All-Time Best!</p>
                </div>
            `;
            return;
        }
        
        const recentRecords = records.slice(0, 5);
        
        list.innerHTML = recentRecords.map(record => `
            <div class="record-item">
                <div class="record-name">${record.exerciseName || record.name || 'Record'}</div>
                <div class="record-details">
                    ${record.type === 'weight' ? 'Max Weight' : 
                      record.type === 'time' ? 'Best Time' : 'Max Score'}: 
                    ${record.value}${record.type === 'weight' ? 'kg' : record.type === 'time' ? 's' : ''}
                </div>
                ${record.date ? `<div class="record-date">${new Date(record.date).toLocaleDateString()}</div>` : ''}
            </div>
        `).join('');
    }

    setupModals() {
        // Profile editor modal setup
        const profileEditorModal = document.getElementById('profileEditorModal');
        const closeEditorModal = document.getElementById('closeEditorModal');
        const closeProfileEditor = document.getElementById('closeProfileEditor');
        
        [closeEditorModal, closeProfileEditor].forEach(btn => {
            btn.addEventListener('click', () => {
                profileEditorModal.classList.remove('show');
            });
        });
        
        profileEditorModal.addEventListener('click', (e) => {
            if (e.target === profileEditorModal) {
                profileEditorModal.classList.remove('show');
            }
        });
        
        // Stats modals
        document.querySelectorAll('.close-stats-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stats-modal').forEach(modal => {
                    modal.classList.remove('show');
                });
            });
        });
        
        document.querySelectorAll('.stats-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    bindEvents() {
        // Edit profile button
        const editBtn = document.getElementById('editProfileBtn');
        editBtn.addEventListener('click', () => {
            this.openProfileEditor();
        });

        // Edit avatar button
        const editAvatarBtn = document.getElementById('editAvatarBtn');
        const avatarInput = document.getElementById('avatarInput');
        
        editAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
        
        // Avatar upload
        avatarInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Camera icon button in editor modal
        const cameraIconBtn = document.getElementById('cameraIconBtn');
        const imageUploadInput = document.getElementById('imageUploadInput');
        
        cameraIconBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });
        
        imageUploadInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Reset form button
        document.getElementById('resetProfileForm').addEventListener('click', () => this.resetEditor());
        
        // Form submission
        document.getElementById('saveProfileBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
        
        // Auto capitalize text inputs
        document.querySelectorAll('.premium-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.autoCapitalize(e.target);
            });
        });
        
        // Stats boxes click
        document.querySelectorAll('.stat-card').forEach(box => {
            box.addEventListener('click', () => {
                const id = box.id;
                if (id === 'streakBox') {
                    document.getElementById('streakModal').classList.add('show');
                } else if (id === 'workoutsBox') {
                    document.getElementById('workoutsModal').classList.add('show');
                } else if (id === 'savedBox') {
                    const modal = document.getElementById('savedModal');
                    if (modal) {
                        this.displaySavedWorkouts();
                        modal.classList.add('show');
                    }
                } else if (id === 'planBox') {
                    const modal = document.getElementById('planModal');
                    if (modal) {
                        const today = new Date();
                        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
                        this.displayTodaysPlan([], dayName);
                        modal.classList.add('show');
                    }
                } else if (id === 'recordsBox') {
                    const modal = document.getElementById('recordsModal');
                    if (modal) {
                        const records = this.storage.getRecords();
                        this.displayRecords(records);
                        modal.classList.add('show');
                    }
                }
            });
        });
    }

    autoCapitalize(input) {
        let cursorPosition = input.selectionStart;
        let value = input.value;
        value = value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        input.value = value;
        input.setSelectionRange(cursorPosition, cursorPosition);
    }

    openProfileEditor() {
        const modal = document.getElementById('profileEditorModal');
        
        document.getElementById('editUserName').value = this.profileData.name || '';
        document.getElementById('editUserGoal').value = this.profileData.tagline || '';
        
        this.updateProfileImagePreview(this.profileData.image);
        
        modal.classList.add('show');
        
        const modalBody = modal.querySelector('.premium-body');
        if (modalBody) {
            modalBody.style.overflowY = 'auto';
        }
        
        this.showMessage('Edit your profile details', 'info');
    }

    updateProfileImagePreview(imageData) {
        const currentImage = document.getElementById('currentProfileImage');
        const profileImageWrapper = document.getElementById('profileImageWrapper');
        const noImagePlaceholder = profileImageWrapper.querySelector('.no-image-placeholder');
        
        if (imageData) {
            currentImage.src = imageData;
            profileImageWrapper.classList.add('has-image');
            currentImage.style.display = 'block';
            noImagePlaceholder.style.display = 'none';
        } else {
            profileImageWrapper.classList.remove('has-image');
            currentImage.style.display = 'none';
            noImagePlaceholder.style.display = 'flex';
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select an image file', 'warning');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('Image size should be less than 5MB', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Check if we're in editor modal or main page
            const currentImage = document.getElementById('currentProfileImage');
            if (currentImage && currentImage.style.display !== 'none') {
                // Update preview in editor
                this.updateProfileImagePreview(imageData);
            } else {
                // Update main profile image
                this.profileData.image = imageData;
                this.saveProfileData();
                this.loadProfileImage();
            }
            
            this.showMessage('Image uploaded successfully!', 'success');
        };
        reader.onerror = () => {
            this.showMessage('Failed to read image file', 'error');
        };
        reader.readAsDataURL(file);
        
        // Reset file input
        event.target.value = '';
    }

    saveProfile() {
        const name = document.getElementById('editUserName').value.trim();
        const goal = document.getElementById('editUserGoal').value.trim();
        
        if (!name) {
            this.showMessage('Please enter your name', 'warning');
            return;
        }
        
        // Update profile data
        this.profileData.name = this.capitalizeFirstLetter(name);
        this.profileData.tagline = goal;
        
        // Get the image from the preview
        const currentImage = document.getElementById('currentProfileImage');
        if (currentImage && currentImage.src) {
            this.profileData.image = currentImage.src;
        }
        
        this.saveProfileData();
        this.loadProfile();
        this.updateWorkoutStatus();
        
        // Close modal
        document.getElementById('profileEditorModal').classList.remove('show');
        
        // Show success message
        this.showMessage('Profile saved successfully! 🎉', 'success');
        this.createConfettiAnimation();
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    resetEditor() {
        document.getElementById('editUserName').value = this.profileData.name || '';
        document.getElementById('editUserGoal').value = this.profileData.tagline || '';
        this.updateProfileImagePreview(this.profileData.image);
        this.showMessage('Form reset to current values', 'info');
    }

    createConfettiAnimation() {
        const confettiContainer = document.getElementById('confettiContainer');
        if (!confettiContainer) return;
        
        confettiContainer.style.display = 'block';
        confettiContainer.innerHTML = '';
        
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2'];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
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
        
        setTimeout(() => {
            confettiContainer.style.display = 'none';
        }, 4000);
    }

    showMessage(message, type = 'info') {
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
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
