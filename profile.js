// Add these CDN links to your HTML head section
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css">
// <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js"></script>

class ProfileManager {
    constructor() {
        this.storage = new WorkoutStorage();
        this.profileData = this.loadProfileData();
        this.selectedImage = null;
        this.cropper = null;
        this.isCropping = false;
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
        
        const dateString = now.toLocaleDateString('en-GB'); // DD/MM/YYYY format
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
            this.showPremiumMessage('Workout completed today! Keep up the great work!', 'success');
        } else {
            const plans = this.storage.getPlans();
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
                this.showPremiumMessage('Rest day! Your muscles grow when you recover.', 'info');
            } else {
                statusMessage.className = 'status-message pending';
                statusMessage.innerHTML = `
                    <i class="fas fa-dumbbell"></i>
                    Today's workout: ${focus} - Ready to train? 💪
                `;
                this.showPremiumMessage(`Ready for ${focus} workout today! Let's crush it!`, 'warning');
            }
        }
    }

    loadQuickStats() {
    const workouts = this.storage.getWorkouts();
    const records = this.storage.getRecords();
    const plans = this.storage.getPlans();
    
    // Calculate streak
    const streak = this.calculateStreak(workouts);
    document.getElementById('streakValue').textContent = `${streak} days`;
    document.getElementById('streakDetailValue').textContent = streak;
    
    // Total workouts
    const totalWorkouts = workouts.filter(w => w.completed).length;
    document.getElementById('totalWorkoutsValue').textContent = totalWorkouts;
    document.getElementById('workoutsDetailValue').textContent = totalWorkouts;
    
    // Saved workouts (FIXED: Count unique exercise names from plans)
    const savedWorkoutsCount = this.getSavedWorkoutsCount();
    document.getElementById('savedWorkoutsValue').textContent = savedWorkoutsCount;
    this.displaySavedWorkouts(); // This will load the list
    
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
    this.displayTodaysPlan(plans, dayName);
    
    // Records count
    document.getElementById('recordsValue').textContent = `${records.length} records`;
    this.displayRecords(records);
}

// Add this new method to count saved workouts:
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
    if (!list) {
        console.error('Saved workouts list container not found!');
        return;
    }
    
    // Get all plans from storage
    const plans = this.storage.getPlans();
    console.log('Total plans found:', plans.length);
    
    // Collect ALL unique exercise names from ALL plans
    const allExerciseNames = new Set(); // Using Set to automatically remove duplicates
    
    plans.forEach((plan, planIndex) => {
        console.log(`Checking plan ${planIndex}: ${plan.name}`);
        
        if (plan.days && Array.isArray(plan.days)) {
            plan.days.forEach((day, dayIndex) => {
                if (day.exercises && Array.isArray(day.exercises)) {
                    day.exercises.forEach((exercise, exIndex) => {
                        if (exercise.name && typeof exercise.name === 'string') {
                            const cleanName = exercise.name.trim();
                            console.log(`  Found exercise: "${cleanName}" in ${day.name}`);
                            allExerciseNames.add(cleanName);
                        }
                    });
                }
            });
        }
    });
    
    // Convert Set to Array and sort alphabetically
    const uniqueExerciseNames = Array.from(allExerciseNames).sort();
    console.log('Unique exercise names:', uniqueExerciseNames);
    console.log('Total unique exercises:', uniqueExerciseNames.length);
    
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
    
    // Clear and display each exercise name
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
    
    console.log('Successfully displayed', uniqueExerciseNames.length, 'saved exercises');
}

    displayTodaysPlan(plans, dayName) {
    const container = document.getElementById('todaysPlanDetail');
    if (!container) {
        console.error('Today\'s plan container not found!');
        return;
    }
    
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
    
    // Get saved exercises for today from plans
    const todayExercises = this.getExercisesForDay(dayName);
    
    // Clear container
    container.innerHTML = '';
    
    if (focus === 'Rest') {
        container.innerHTML = `
            <div class="rest-day-detail">
                <div class="detail-icon">🛌</div>
                <div class="detail-title">Rest Day</div>
                <div class="detail-subtitle">${dayName}</div>
                <p class="detail-description">Enjoy your recovery! Your body grows stronger when you rest.</p>
                
                ${todayExercises.length > 0 ? `
                    <div class="saved-exercises-section">
                        <h4><i class="fas fa-dumbbell"></i> Saved Exercises (Optional):</h4>
                        <div class="exercises-list">
                            ${todayExercises.map(ex => `
                                <div class="exercise-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${ex.name} - ${ex.sets} sets × ${ex.target} ${ex.type === 'time' ? 'sec' : 'reps'}</span>
                                </div>
                            `).join('')}
                        </div>
                        <p class="note">Note: You can still do light exercises on rest days if desired.</p>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="plan-detail">
                <div class="detail-icon">🏋️‍♂️</div>
                <div class="detail-title">${focus}</div>
                <div class="detail-subtitle">${dayName} Workout</div>
                <p class="detail-description">Focus on ${focus.toLowerCase()} today. Push yourself and stay hydrated!</p>
                
                ${todayExercises.length > 0 ? `
                    <div class="saved-exercises-section">
                        <h4><i class="fas fa-list-check"></i> Your Saved Plan:</h4>
                        <div class="exercises-list">
                            ${todayExercises.map(ex => `
                                <div class="exercise-item">
                                    <i class="fas fa-dumbbell"></i>
                                    <div class="exercise-info">
                                        <div class="exercise-name">${ex.name}</div>
                                        <div class="exercise-details">${ex.sets} sets × ${ex.target} ${ex.type === 'time' ? 'seconds' : 'reps'}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="no-exercises-message">
                        <i class="fas fa-clipboard-question"></i>
                        <p>No exercises saved for ${dayName} yet. Go to Workout Plans to add exercises!</p>
                    </div>
                `}
                
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

// Add this helper method to get exercises for a specific day
getExercisesForDay(dayName) {
    const plans = this.storage.getPlans();
    if (plans.length === 0) return [];
    
    // Find the main plan
    const mainPlan = plans.find(p => p.name === "7-Days Muscle Building Plan");
    if (!mainPlan || !mainPlan.days) return [];
    
    // Find the day
    const day = mainPlan.days.find(d => d.name === dayName);
    if (!day || !day.exercises) return [];
    
    return day.exercises;
}

    displayRecords(records) {
    const list = document.getElementById('recordsDetailList');
    if (!list) {
        console.error('Records list container not found!');
        return;
    }
    
    if (records.length === 0) {
        list.innerHTML = `
            <div class="no-records-message">
                <i class="fas fa-trophy"></i>
                <p>No records yet. Add some in All-Time Best!</p>
            </div>
        `;
        return;
    }
    
    // Show recent records (limit to 5)
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
                this.closeCropModal();
            });
        });
        
        // Close modal when clicking outside
        profileEditorModal.addEventListener('click', (e) => {
            if (e.target === profileEditorModal) {
                profileEditorModal.classList.remove('show');
                this.closeCropModal();
            }
        });
        
        // Image crop modal setup
        const imageCropModal = document.getElementById('imageCropModal');
        const closeCropModal = document.getElementById('closeCropModal');
        const closeCropBtn = document.getElementById('closeCropBtn');
        
        [closeCropModal, closeCropBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeCropModal();
            });
        });
        
        // Close crop modal when clicking outside
        imageCropModal.addEventListener('click', (e) => {
            if (e.target === imageCropModal) {
                this.closeCropModal();
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

        // Edit avatar button from main profile page
        const editAvatarBtn = document.getElementById('editAvatarBtn');
        const avatarInput = document.getElementById('avatarInput');
        
        editAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
        
        // Avatar upload from profile page
        avatarInput.addEventListener('change', (e) => this.handleImageUploadSimple(e));
        
      // Stats boxes click
document.querySelectorAll('.stat-card').forEach(box => {
    box.addEventListener('click', (e) => {
        const id = box.id;
        
        if (id === 'streakBox') {
            document.getElementById('streakModal').classList.add('show');
            
        } else if (id === 'workoutsBox') {
            document.getElementById('workoutsModal').classList.add('show');
            
        } else if (id === 'savedBox') {
            const modal = document.getElementById('savedModal');
            if (modal) {
                console.log('Opening saved workouts modal...');
                this.displaySavedWorkouts(); // Load content FIRST
                modal.classList.add('show'); // Then show modal
            }
            
        } else if (id === 'planBox') {
            const modal = document.getElementById('planModal');
            if (modal) {
                console.log('Opening today\'s plan modal...');
                // Load today's plan content FIRST
                const today = new Date();
                const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
                this.displayTodaysPlan([], dayName); // Pass empty plans array if not used
                modal.classList.add('show'); // Then show modal
            }
            
        } else if (id === 'recordsBox') {
            const modal = document.getElementById('recordsModal');
            if (modal) {
                console.log('Opening records modal...');
                // Load records content FIRST
                const records = this.storage.getRecords();
                this.displayRecords(records);
                modal.classList.add('show'); // Then show modal
            }
        }
    });
});
        // Camera icon button in editor modal
        const cameraIconBtn = document.getElementById('cameraIconBtn');
        const imageUploadInput = document.getElementById('imageUploadInput');
        
        cameraIconBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });
        
        imageUploadInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Apply crop button
        document.getElementById('applyCropBtn').addEventListener('click', () => this.applyCrop());
        
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
    }

    autoCapitalize(input) {
        let cursorPosition = input.selectionStart;
        let value = input.value;
        
        // Capitalize first letter of each word
        value = value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        
        input.value = value;
        
        // Restore cursor position
        input.setSelectionRange(cursorPosition, cursorPosition);
    }

    openProfileEditor() {
        const modal = document.getElementById('profileEditorModal');
        
        // Populate form with current data
        document.getElementById('editUserName').value = this.profileData.name || '';
        document.getElementById('editUserGoal').value = this.profileData.tagline || '';
        
        // Load current image preview
        this.updateProfileImagePreview(this.profileData.image);
        
        modal.classList.add('show');
        
        // Ensure modal body is scrollable
        const modalBody = modal.querySelector('.premium-body');
        if (modalBody) {
            modalBody.style.overflowY = 'auto';
        }
        
        this.showPremiumMessage('Edit your profile details', 'info');
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

    handleImageUploadSimple(event) {
        // Simple upload for profile page (no cropper)
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showPremiumMessage('Please select an image file', 'warning');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showPremiumMessage('Image size should be less than 5MB', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.profileData.image = e.target.result;
            this.saveProfileData();
            this.loadProfileImage();
            this.showPremiumMessage('Profile picture updated!', 'success');
            this.createConfettiAnimation();
        };
        reader.readAsDataURL(file);
    }

    handleImageUpload(event) {
        // Upload for editor modal (opens crop modal)
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            this.showPremiumMessage('Please select an image file (JPEG, PNG, etc.)', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showPremiumMessage('Image must be less than 5MB', 'error');
            return;
        }

        // Read file and open crop modal
        const reader = new FileReader();
        reader.onload = (e) => {
            this.openCropModal(e.target.result);
        };
        reader.onerror = () => {
            this.showPremiumMessage('Failed to read image file', 'error');
        };
        reader.readAsDataURL(file);
        
        // Reset file input after selection
        event.target.value = '';
    }

              openCropModal(imageSrc) {
        console.log('Opening crop modal with image source');
        
        const cropModal = document.getElementById('imageCropModal');
        const cropperContainer = document.getElementById('cropperContainer');

        if (!cropModal || !cropperContainer) {
            console.error('Modal or container not found');
            return;
        }

        // Show modal
        cropModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Clear container
        cropperContainer.innerHTML = '';
        
        // Create image element with proper styling
        const imageElement = document.createElement('img');
        imageElement.id = 'imageToCrop';
        imageElement.src = imageSrc;
        imageElement.alt = 'Image to crop';
        imageElement.style.display = 'block';
        imageElement.style.maxWidth = '100%';
        imageElement.style.maxHeight = '100%';
        imageElement.style.objectFit = 'contain'; // This makes image fit within container
        
        cropperContainer.appendChild(imageElement);
        
        console.log('Image added to container');

        // Wait for image to load
        imageElement.onload = () => {
            console.log('Image loaded successfully');
            console.log('Image natural dimensions:', imageElement.naturalWidth, 'x', imageElement.naturalHeight);
            console.log('Container dimensions:', cropperContainer.offsetWidth, 'x', cropperContainer.offsetHeight);
            
            // Initialize cropper
            this.initializeCropper(imageElement);
        };
        
        imageElement.onerror = () => {
            console.error('Failed to load image');
            this.showPremiumMessage('Failed to load image', 'error');
            this.closeCropModal();
        };
    }

    initializeCropper(imageElement) {
        // Destroy previous cropper
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        
        // Set a timeout to ensure DOM is ready
        setTimeout(() => {
            console.log('Initializing cropper...');
            
            // Get container dimensions
            const container = document.getElementById('cropperContainer');
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            
            console.log('Container size for cropper:', containerWidth, 'x', containerHeight);
            
            // Initialize cropper with proper options
            this.cropper = new Cropper(imageElement, {
                aspectRatio: 1, // Square for circle
                viewMode: 3,    // CHANGED: This makes the image fit within container
                dragMode: 'crop',
                initialAspectRatio: 1,
                autoCropArea: 0.8, // Start with 80% of image cropped
                responsive: true,
                restore: true,
                guides: true,
                center: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: true,
                minContainerWidth: containerWidth,
                minContainerHeight: containerHeight,
                minCanvasWidth: containerWidth,
                minCanvasHeight: containerHeight,
                minCropBoxWidth: 100,
                minCropBoxHeight: 100,
                background: false,
                modal: true,
                scalable: true,
                zoomable: true,
                zoomOnTouch: true,
                zoomOnWheel: true,
                wheelZoomRatio: 0.1,
                ready: () => {
                    console.log('Cropper is ready!');
                    console.log('Canvas data:', this.cropper.getCanvasData());
                    console.log('Crop box data:', this.cropper.getCropBoxData());
                    
                    this.showPremiumMessage('Drag corners or edges to adjust crop area', 'info');
                    
                    // Force the crop box to be visible
                    setTimeout(() => {
                        const canvasData = this.cropper.getCanvasData();
                        const cropBoxData = {
                            left: canvasData.left,
                            top: canvasData.top,
                            width: canvasData.width * 0.8,
                            height: canvasData.height * 0.8
                        };
                        this.cropper.setCropBoxData(cropBoxData);
                    }, 100);
                },
                crop: (event) => {
                    console.log('Crop event:', event.detail);
                }
            });
            
        }, 100);
    }

    closeCropModal() {
        const cropModal = document.getElementById('imageCropModal');
        if (cropModal) {
            cropModal.classList.remove('show');
            document.body.style.overflow = '';

            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }

            // Clear the cropper container
            const cropperContainer = document.getElementById('cropperContainer');
            if (cropperContainer) {
                cropperContainer.innerHTML = '';
            }

            // Reset file input
            const imageUploadInput = document.getElementById('imageUploadInput');
            if (imageUploadInput) {
                imageUploadInput.value = '';
            }
        }
    }

    applyCrop() {
        if (!this.cropper) {
            this.showPremiumMessage('No image to crop', 'error');
            return;
        }

        try {
            // Get cropped image as base64 - USING THE WORKING METHOD FROM YOUR CODE
            const croppedCanvas = this.cropper.getCroppedCanvas({
                width: 400,
                height: 400,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            if (!croppedCanvas) {
                this.showPremiumMessage('Failed to crop image', 'error');
                return;
            }

            const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
            
            // Update the selected image for saving
            this.selectedImage = croppedImage;
            
            // Update profile image preview IMMEDIATELY
            this.updateProfileImagePreview(croppedImage);
            
            // Show success message
            this.showPremiumMessage('Image cropped successfully! Click "Save Profile" to save changes.', 'success');

            // Close crop modal
            this.closeCropModal();

        } catch (error) {
            console.error('Crop error:', error);
            this.showPremiumMessage('Failed to crop image', 'error');
        }
    }

    saveProfile() {
        const name = document.getElementById('editUserName').value.trim();
        const goal = document.getElementById('editUserGoal').value.trim();
        
        if (!name) {
            this.showPremiumMessage('Please enter your name', 'warning');
            return;
        }
        
        // Update profile data
        this.profileData.name = this.capitalizeFirstLetter(name);
        this.profileData.tagline = goal;
        
        // If we have a newly cropped image, use it
        if (this.selectedImage) {
            this.profileData.image = this.selectedImage;
        }
        
        this.saveProfileData();
        this.loadProfile();
        this.updateWorkoutStatus();
        
        // Close modal
        document.getElementById('profileEditorModal').classList.remove('show');
        
        // Show success message
        this.showPremiumMessage('Profile saved successfully! 🎉', 'success');
        
        // Trigger confetti animation
        this.createConfettiAnimation();
        
        // Reset selected image
        this.selectedImage = null;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    resetEditor() {
        document.getElementById('editUserName').value = this.profileData.name || '';
        document.getElementById('editUserGoal').value = this.profileData.tagline || '';
        
        // Reset image preview
        this.updateProfileImagePreview(this.profileData.image);
        
        // Reset selected image
        this.selectedImage = null;
        
        this.showPremiumMessage('Form reset to current values', 'info');
    }

    createConfettiAnimation() {
        const confettiContainer = document.getElementById('confettiContainer');
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
        debugCropperContainer() {
        const cropperContainer = document.getElementById('cropperContainer');
        if (!cropperContainer) {
            console.error('Cropper container not found!');
            return;
        }
        
        console.log('Cropper container children:', cropperContainer.children.length);
        console.log('Cropper container HTML:', cropperContainer.innerHTML);
        
        // Check all images
        const images = cropperContainer.querySelectorAll('img');
        console.log('Found images:', images.length);
        
        images.forEach((img, i) => {
            console.log(`Image ${i}:`, {
                id: img.id,
                src: img.src.substring(0, 50) + '...',
                width: img.width,
                height: img.height,
                style: img.style.cssText
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});