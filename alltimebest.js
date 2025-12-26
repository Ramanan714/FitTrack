// Make sure there's no extra character before 'class'
    class AllTimeBest {
    constructor() {
        this.storage = new WorkoutStorage();
        this.records = this.getRecords();
        this.editingRecordId = null;
        this.currentSort = 'date-desc';
        this.init();
    }

    init() {
        this.loadRecords();
        this.bindEvents();
        this.setDefaultDate();
        this.triggerPageLoadAnimation(); // Add this line
    }

    getRecords() {
        return this.storage.getRecords(); // Use storage method
    }

    saveRecords() {
        // Save each record to storage
        this.records.forEach(record => {
            if (!record.id) {
                record.id = this.generateId();
                this.storage.saveRecord(record);
            } else {
                this.storage.updateRecord(record);
            }
        });
        
        // Also update localStorage directly for compatibility
        localStorage.setItem('workoutTracker_records', JSON.stringify(this.records));
    }

    loadRecords() {
        const recordsList = document.getElementById('recordsList');
        
        if (this.records.length === 0) {
            recordsList.innerHTML = `
                <div class="empty-records">
                    <i class="fas fa-trophy"></i>
                    <h3>No Records Yet</h3>
                    <p>Add your first personal best to get started!</p>
                </div>
            `;
            return;
        }

        // Sort records based on current sort option
        const sortedRecords = this.sortRecords(this.records);
        
        recordsList.innerHTML = sortedRecords.map(record => `
            <div class="record-card" data-record-id="${record.id}">
                <div class="record-header">
                    <div>
                        <div class="record-name">${record.exerciseName}</div>
                        <div class="record-type">${this.getTypeDisplayName(record.type)} record</div>
                    </div>
                    <div class="record-badge">Personal Best</div>
                </div>
                
                <div class="record-details">
                    <div class="record-value">
                        <span class="value-number">${this.formatValue(record.value, record.type)}</span>
                        <span class="value-unit">${this.getUnit(record.type)}</span>
                    </div>
                    <div class="record-date">
                        <span class="date-label">Achieved</span>
                        <span class="date-value">${new Date(record.date).toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
                
                ${record.notes ? `
                    <div class="record-notes">
                        <strong>Notes:</strong> ${record.notes}
                    </div>
                ` : ''}
                
                <div class="record-actions">
                    <button class="update-record" onclick="allTimeBest.updateRecord('${record.id}')">
                        <i class="fas fa-edit"></i> Update
                    </button>
                    <button class="delete-record" onclick="allTimeBest.deleteRecord('${record.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    sortRecords(records) {
        switch (this.currentSort) {
            case 'name-asc':
                return records.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
            case 'name-desc':
                return records.sort((a, b) => b.exerciseName.localeCompare(a.exerciseName));
            case 'time-asc':
                return records.sort((a, b) => a.value - b.value);
            case 'time-desc':
                return records.sort((a, b) => b.value - a.value);
            case 'date-asc':
                return records.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'date-desc':
            default:
                return records.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }

    getTypeDisplayName(type) {
        const displayNames = {
            'weight': 'Max Weight',
            'reps': 'Score',
            'time': 'Best Time'
        };
        return displayNames[type] || type;
    }

    formatValue(value, type) {
        if (type === 'time') {
            // Convert seconds to minutes:seconds format
            const minutes = Math.floor(value / 60);
            const seconds = value % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return type === 'weight' ? value.toFixed(1) : value;
    }

    getUnit(type) {
        const units = {
            'weight': 'kg',
            'reps': 'score',
            'time': 'min:sec'
        };
        return units[type] || '';
    }

    

    

    // Add this method for page load animation
    triggerPageLoadAnimation() {
        setTimeout(() => {
            // Animate trophy icon
            const trophyIcon = document.querySelector('.summary-icon');
            if (trophyIcon) {
                trophyIcon.classList.add('animate-trophy');
                
                // Create sparkle elements
                this.createSparkles(trophyIcon);
            }
            
            // Animate header
            const headerContent = document.querySelector('.header-content');
            if (headerContent) {
                headerContent.classList.add('animate-header');
            }
            
            // Stagger animations for cards
            setTimeout(() => {
                this.animateCardsIn();
            }, 800);
            
        }, 300); // Small delay for initial load
    }

    // Add this method to create sparkles
    createSparkles(parentElement) {
        const positions = [
            { class: 'top-left', top: -10, left: 15 },
            { class: 'top-right', top: -5, right: 20 },
            { class: 'bottom-left', bottom: -8, left: 25 },
            { class: 'bottom-right', bottom: -12, right: 15 }
        ];
        
        positions.forEach(pos => {
            const sparkle = document.createElement('div');
            sparkle.className = `sparkle ${pos.class}`;
            
            // Set position
            Object.keys(pos).forEach(key => {
                if (key !== 'class') {
                    sparkle.style[key] = `${pos[key]}px`;
                }
            });
            
            parentElement.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2000);
        });
    }

    // Add this method to animate cards
    animateCardsIn() {
        const cards = document.querySelectorAll('.record-card, .summary-card, .add-record-btn');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Trigger animation
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100); // Stagger each card by 100ms
        });
    }

    // Update the resetForm method to show premium message
    resetForm() {
        document.getElementById('recordForm').reset();
        document.querySelector('input[name="recordType"][value="weight"]').checked = true;
        this.handleTypeChange('weight');
        this.setDefaultDate();
        document.getElementById('setsSection').classList.add('hidden');
        
        // Reset select inputs
        document.getElementById('dateDay').value = '';
        document.getElementById('dateMonth').value = '';
        document.getElementById('dateYear').value = '';
        
        // Reset day options to default
        const daySelect = document.getElementById('dateDay');
        daySelect.innerHTML = '<option value="">Day</option>';
        
        // Show premium reset success message
        this.showResetSuccessMessage();
    }

    // Add this method for reset success message
    showResetSuccessMessage() {
        // Remove any existing reset messages
        const existingMessages = document.querySelectorAll('.reset-success-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create reset success message
        const resetMessage = document.createElement('div');
        resetMessage.className = 'reset-success-message';
        
        resetMessage.innerHTML = `
            <div class="reset-success-content">
                <div class="reset-success-icon">
                    <i class="fas fa-redo"></i>
                </div>
                <div class="reset-success-text">
                    <h3>Form Reset!</h3>
                    <p>All fields have been cleared</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(resetMessage);
        
        // Remove message after animation
        setTimeout(() => {
            if (resetMessage.parentNode) {
                resetMessage.parentNode.removeChild(resetMessage);
            }
        }, 1500);
    }

    // Update bindEvents to add reset button listener if not already there
    bindEvents() {
        console.log('Binding events...');
        
        const addBtn = document.getElementById('addRecordBtn');
        console.log('Add button found:', addBtn);
        
        if (!addBtn) {
            console.error('Add Record button not found! Check HTML ID');
            return;
        }

        // Record type change
        document.querySelectorAll('input[name="recordType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleTypeChange(e.target.value));
        });

        // Modal buttons
        addBtn.addEventListener('click', () => {
            console.log('Add button clicked!');
            this.openModal();
        });
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // RESET BUTTON - Make sure it's properly bound
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            console.log('Reset button found, adding listener');
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Reset button clicked!');
                this.resetForm();
            });
        } else {
            console.error('Reset button not found! Check HTML ID');
        }
        
        document.getElementById('recordForm').addEventListener('submit', (e) => this.saveRecord(e));

        // Month change event for dynamic days
        document.getElementById('dateMonth').addEventListener('change', () => this.updateDaysForMonth());
        document.getElementById('dateYear').addEventListener('change', () => this.updateDaysForMonth());

        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.loadRecords();
        });

        // Close modal when clicking outside
        document.getElementById('recordModal').addEventListener('click', (e) => {
            if (e.target.id === 'recordModal') {
                this.closeModal();
            }
        });
    }

    


    updateDaysForMonth() {
        const monthSelect = document.getElementById('dateMonth');
        const yearSelect = document.getElementById('dateYear');
        const daySelect = document.getElementById('dateDay');
        
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        
        if (!month || !year) {
            // Clear days if month or year not selected
            daySelect.innerHTML = '<option value="">Day</option>';
            return;
        }
        
        // Get number of days in the selected month
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Update day options
        let dayOptions = '<option value="">Day</option>';
        for (let day = 1; day <= daysInMonth; day++) {
            dayOptions += `<option value="${day}">${day}</option>`;
        }
        
        daySelect.innerHTML = dayOptions;
    }

    handleTypeChange(type) {
        const valueLabel = document.getElementById('valueLabel');
        const recordValue = document.getElementById('recordValue');
        const setsSection = document.getElementById('setsSection');
        
        // Update label and placeholder - Keep "Score" instead of changing to "Reps"
        const labels = {
            'weight': 'Weight (kg)',
            'reps': 'Score',
            'time': 'Time (seconds)'
        };
        
        valueLabel.innerHTML = `<i class="fas fa-tachometer-alt"></i> ${labels[type]}`;
        
        // Show/hide sets section
        if (type === 'reps' || type === 'time') {
            setsSection.classList.remove('hidden');
        } else {
            setsSection.classList.add('hidden');
        }
        
        // Set appropriate input attributes
        if (type === 'weight') {
            recordValue.step = '0.1';
            recordValue.placeholder = 'Enter weight in kg (e.g., 75.5)';
        } else if (type === 'time') {
            recordValue.step = '1';
            recordValue.placeholder = 'Enter time in seconds (e.g., 180 for 3 minutes)';
        } else {
            recordValue.step = '1';
            recordValue.placeholder = 'Enter your score (e.g., 15)';
        }
    }

    updateDateFromSelects() {
        const day = document.getElementById('dateDay').value;
        const month = document.getElementById('dateMonth').value;
        const year = document.getElementById('dateYear').value;
        
        if (day && month && year) {
            const date = new Date(year, month - 1, day);
            
            // Create a hidden date input for compatibility
            let dateInput = document.getElementById('recordDate');
            if (!dateInput) {
                dateInput = document.createElement('input');
                dateInput.type = 'hidden';
                dateInput.id = 'recordDate';
                document.getElementById('recordForm').appendChild(dateInput);
            }
            dateInput.value = date.toISOString().split('T')[0];
        }
    }

    updateSelectsFromDate(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        document.getElementById('dateDay').value = day;
        document.getElementById('dateMonth').value = month;
        document.getElementById('dateYear').value = year;
        
        // Update days for the selected month
        this.updateDaysForMonth();
    }

    getSelectedDate() {
        // First try to get from hidden input
        const dateInput = document.getElementById('recordDate');
        if (dateInput && dateInput.value) {
            return new Date(dateInput.value);
        }
        
        // Fallback to select inputs
        const day = document.getElementById('dateDay').value;
        const month = document.getElementById('dateMonth').value;
        const year = document.getElementById('dateYear').value;
        
        if (day && month && year) {
            return new Date(year, month - 1, day);
        }
        
        return new Date(); // Return today if no selection
    }

    openModal(record = null) {
        this.editingRecordId = record ? record.id : null;
        const modal = document.getElementById('recordModal');
        const title = document.getElementById('modalTitle');
        
        if (record) {
            title.textContent = '🏆 Update Record';
            this.populateForm(record);
        } else {
            title.textContent = '🏆 Add New Record';
            this.resetForm();
        }
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('recordModal').classList.remove('show');
        this.editingRecordId = null;
        this.resetForm();
    }

    resetForm() {
        document.getElementById('recordForm').reset();
        document.querySelector('input[name="recordType"][value="weight"]').checked = true;
        this.handleTypeChange('weight');
        this.setDefaultDate();
        document.getElementById('setsSection').classList.add('hidden');
        
        // Reset select inputs
        document.getElementById('dateDay').value = '';
        document.getElementById('dateMonth').value = '';
        document.getElementById('dateYear').value = '';
        
        // Reset day options to default
        const daySelect = document.getElementById('dateDay');
        daySelect.innerHTML = '<option value="">Day</option>';
    }

    populateForm(record) {
        document.getElementById('exerciseName').value = record.exerciseName;
        document.querySelector(`input[name="recordType"][value="${record.type}"]`).checked = true;
        document.getElementById('recordValue').value = record.value;
        
        const recordDate = new Date(record.date);
        this.updateSelectsFromDate(recordDate);
        
        // Create hidden date input for compatibility
        let dateInput = document.getElementById('recordDate');
        if (!dateInput) {
            dateInput = document.createElement('input');
            dateInput.type = 'hidden';
            dateInput.id = 'recordDate';
            document.getElementById('recordForm').appendChild(dateInput);
        }
        dateInput.value = recordDate.toISOString().split('T')[0];
        
        document.getElementById('recordNotes').value = record.notes || '';
        
        this.handleTypeChange(record.type);
    }

    setDefaultDate() {
        const today = new Date();
        
        // Create hidden date input for compatibility
        let dateInput = document.getElementById('recordDate');
        if (!dateInput) {
            dateInput = document.createElement('input');
            dateInput.type = 'hidden';
            dateInput.id = 'recordDate';
            document.getElementById('recordForm').appendChild(dateInput);
        }
        dateInput.value = today.toISOString().split('T')[0];
        
        this.updateSelectsFromDate(today);
    }

    saveRecord(e) {
        e.preventDefault();
        
        const exerciseName = document.getElementById('exerciseName').value.trim();
        const recordType = document.querySelector('input[name="recordType"]:checked').value;
        const recordValue = parseFloat(document.getElementById('recordValue').value);
        const recordSets = document.getElementById('recordSets').value ? parseInt(document.getElementById('recordSets').value) : 1;
        const recordDate = this.getSelectedDate();
        const recordNotes = document.getElementById('recordNotes').value.trim();

        if (!exerciseName) {
            this.showPremiumToast('Please enter an exercise name!', 'warning');
            return;
        }

        if (!recordValue || recordValue <= 0) {
            this.showPremiumToast('Please enter a valid record value!', 'warning');
            return;
        }

        const recordData = {
            id: this.editingRecordId || this.generateId(),
            exerciseName: this.capitalizeWords(exerciseName),
            type: recordType,
            value: recordValue,
            sets: recordSets,
            date: recordDate.toISOString(),
            notes: recordNotes,
            createdAt: new Date().toISOString()
        };

        if (this.editingRecordId) {
            // Update existing record
            const index = this.records.findIndex(r => r.id === this.editingRecordId);
            if (index !== -1) {
                this.records[index] = recordData;
            }
            const message = `🎉 "${recordData.exerciseName}" record updated successfully!`;
            this.showPremiumToast(message, 'success');
        } else {
            // Add new record
            this.records.push(recordData);
            const message = `🏆 New "${recordData.exerciseName}" record added to your personal bests!`;
            this.showPremiumToast(message, 'success');
            this.createConfettiAnimation();
        }

        this.saveRecords(); // This should now work
        this.loadRecords();
        this.closeModal();
    }

    updateRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (record) {
            this.openModal(record);
        }
    }

    deleteRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (record) {
            this.showDeleteConfirmation(recordId, record.exerciseName);
        }
    }

    showDeleteConfirmation(recordId, exerciseName) {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'deleteConfirmModal';
        
        modal.innerHTML = `
            <div class="modal-content premium-modal premium-confirm-modal">
                <div class="modal-body">
                    <div class="confirm-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="confirm-title">Delete Record</div>
                    <div class="confirm-message">
                        Are you sure you want to delete your <strong>"${exerciseName.replace(/'/g, "&apos;")}"</strong> record?<br>
                        <span style="color: #ef4444; font-size: 0.9em;">This action cannot be undone!</span>
                    </div>
                    <div class="confirm-actions">
                        <button class="confirm-btn cancel" id="cancelDelete">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button class="confirm-btn delete" id="confirmDelete">
                            <i class="fas fa-trash"></i>
                            Delete Record
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('cancelDelete').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
        
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete(recordId, exerciseName);
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        });
    }

    confirmDelete(recordId, exerciseName) {
    const recordCard = document.querySelector(`.record-card[data-record-id="${recordId}"]`);
    
    if (recordCard) {
        // Start deletion animation
        this.startDeleteAnimation(recordCard, recordId, exerciseName);
    } else {
        // Fallback if card not found
        this.records = this.records.filter(record => record.id !== recordId);
        this.saveRecords();
        this.loadRecords();
        this.showPremiumToast(`"${exerciseName}" record has been deleted successfully.`, 'danger');
    }
}

    startDeleteAnimation(recordCard, recordId, exerciseName) {
    // Store card position and dimensions
    const cardRect = recordCard.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    // Add deleting class for shake and pop
    recordCard.classList.add('deleting');
    
    // Create and animate red particles
    this.createRedParticleBlast(cardCenterX, cardCenterY);
    
    // Calculate and animate adjacent cards moving up
    this.adjustAdjacentCards(recordCard);
    
    // After animation completes, remove the record
    setTimeout(() => {
        this.records = this.records.filter(record => record.id !== recordId);
        this.saveRecords();
        
        // Remove the card from DOM with collapse animation
        recordCard.classList.remove('deleting');
        recordCard.classList.add('collapsing');
        
        setTimeout(() => {
            this.loadRecords(); // Reload the list
            this.showPremiumToast(`"${exerciseName}" record has been deleted successfully.`, 'danger');
        }, 400);
        
    }, 800); // Wait for shake (500ms) + pop (300ms)
}

createRedParticleBlast(centerX, centerY) {
    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.left = `${centerX}px`;
    particleContainer.style.top = `${centerY}px`;
    
    document.body.appendChild(particleContainer);
    
    // Create 30-50 red particles
    const particleCount = 40;
    const colors = [
        '#ef4444', // Red-500
        '#dc2626', // Red-600
        '#f87171', // Red-400
        '#b91c1c'  // Red-700
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'red-particle';
        
        // Random size variation
        const size = Math.random() * 8 + 4; // 4-12px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random color from red palette
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        
        // Random distance and angle for outward burst
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50; // 50-150px
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        // Random animation duration and delay
        const duration = Math.random() * 0.6 + 0.4; // 0.4-1.0s
        const delay = Math.random() * 0.2; // 0-0.2s
        
        // Choose random particle behavior
        const animationTypes = ['outward', 'upward', 'downward'];
        const animationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
        
        // Set animation properties
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        // Apply animation based on type
        if (animationType === 'outward') {
            particle.style.animation = `particleBurstOutward ${duration}s ease-out ${delay}s forwards`;
        } else if (animationType === 'upward') {
            particle.style.animation = `particleFloatUp ${duration}s ease-out ${delay}s forwards`;
        } else {
            // Downward with gravity effect
            particle.style.animation = `particleBurstOutward ${duration}s cubic-bezier(0.3, 0.7, 0.4, 1) ${delay}s forwards`;
        }
        
        particleContainer.appendChild(particle);
    }
    
    // Remove particle container after animation
    setTimeout(() => {
        if (particleContainer.parentNode) {
            particleContainer.parentNode.removeChild(particleContainer);
        }
    }, 1500);
}

adjustAdjacentCards(deletingCard) {
    // Get all record cards
    const allCards = Array.from(document.querySelectorAll('.record-card'));
    const deletingIndex = allCards.indexOf(deletingCard);
    
    if (deletingIndex === -1) return;
    
    // Get the height of the deleting card (for smooth collapse)
    const cardHeight = deletingCard.offsetHeight;
    deletingCard.style.setProperty('--card-height', `${cardHeight}px`);
    
    // Cards after the deleting one should move up
    for (let i = deletingIndex + 1; i < allCards.length; i++) {
        const card = allCards[i];
        card.style.setProperty('--move-distance', `${cardHeight}px`);
        card.classList.add('adjusting-up');
    }
    
    // Remove adjustment classes after animation
    setTimeout(() => {
        allCards.forEach(card => {
            card.classList.remove('adjusting-up');
            card.style.removeProperty('--move-distance');
        });
    }, 400);
}

    showPremiumToast(message, type = 'success') {
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
            danger: 'fas fa-exclamation-circle'
        };
        
        const titles = {
            success: 'Success!',
            warning: 'Warning!',
            info: 'Info',
            danger: 'Error!'
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
                toast.classList.add('hiding');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 500);
            }
        }, 3000);
    }

    createConfettiAnimation() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.display = 'block';
        
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
        
        document.body.appendChild(confettiContainer);
        
        // Hide confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.style.display = 'none';
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 4000);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    capitalizeWords(text) {
        return text.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

       // Add this method for page load animation
    triggerPageLoadAnimation() {
        setTimeout(() => {
            // Animate trophy icon
            const trophyIcon = document.querySelector('.summary-icon');
            if (trophyIcon) {
                trophyIcon.classList.add('animate-trophy');
                
                // Create sparkle elements
                this.createSparkles(trophyIcon);
            }
            
            // Animate header
            const headerContent = document.querySelector('.header-content');
            if (headerContent) {
                headerContent.classList.add('animate-header');
            }
            
            // Stagger animations for cards
            setTimeout(() => {
                this.animateCardsIn();
            }, 800);
            
        }, 300); // Small delay for initial load
    }

    // Add this method to create sparkles
    createSparkles(parentElement) {
        const positions = [
            { class: 'top-left', top: -10, left: 15 },
            { class: 'top-right', top: -5, right: 20 },
            { class: 'bottom-left', bottom: -8, left: 25 },
            { class: 'bottom-right', bottom: -12, right: 15 }
        ];
        
        positions.forEach(pos => {
            const sparkle = document.createElement('div');
            sparkle.className = `sparkle ${pos.class}`;
            
            // Set position
            Object.keys(pos).forEach(key => {
                if (key !== 'class') {
                    sparkle.style[key] = `${pos[key]}px`;
                }
            });
            
            parentElement.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2000);
        });
    }

    // Add this method to animate cards
    animateCardsIn() {
        const cards = document.querySelectorAll('.record-card, .summary-card, .add-record-btn');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Trigger animation
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100); // Stagger each card by 100ms
        });
    }

    // Update the resetForm method to show premium message
    resetForm() {
        document.getElementById('recordForm').reset();
        document.querySelector('input[name="recordType"][value="weight"]').checked = true;
        this.handleTypeChange('weight');
        this.setDefaultDate();
        document.getElementById('setsSection').classList.add('hidden');
        
        // Reset select inputs
        document.getElementById('dateDay').value = '';
        document.getElementById('dateMonth').value = '';
        document.getElementById('dateYear').value = '';
        
        // Reset day options to default
        const daySelect = document.getElementById('dateDay');
        daySelect.innerHTML = '<option value="">Day</option>';
        
        // Show premium reset success message
        this.showResetSuccessMessage();
    }

    // Add this method for reset success message
    showResetSuccessMessage() {
        // Remove any existing reset messages
        const existingMessages = document.querySelectorAll('.reset-success-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create reset success message
        const resetMessage = document.createElement('div');
        resetMessage.className = 'reset-success-message';
        
        resetMessage.innerHTML = `
            <div class="reset-success-content">
                <div class="reset-success-icon">
                    <i class="fas fa-redo"></i>
                </div>
                <div class="reset-success-text">
                    <h3>Form Reset!</h3>
                    <p>All fields have been cleared</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(resetMessage);
        
        // Remove message after animation
        setTimeout(() => {
            if (resetMessage.parentNode) {
                resetMessage.parentNode.removeChild(resetMessage);
            }
        }, 1500);
    }

    triggerPageLoadAnimation() {
    // Create electric overlay flash
    this.createElectricFlash();
    
    // Add animation classes to elements
    setTimeout(() => {
        // Add animated class to main content
        document.querySelector('.alltime-main-content').classList.add('animated');
        
        // Animate header with blue glow
        const headerTitle = document.querySelector('.header-content h1');
        if (headerTitle) {
            headerTitle.style.animation = 'headingBlueGlow 3s ease-in-out infinite 1s';
        }
        
        // Animate section titles
        document.querySelectorAll('.section-title').forEach(title => {
            title.classList.add('animate-electric');
        });
        
        // Animate summary card
        const summaryCard = document.querySelector('.summary-card');
        if (summaryCard) {
            summaryCard.classList.add('animate-electric');
        }
        
        // Animate records controls
        const recordsControls = document.querySelector('.records-controls');
        if (recordsControls) {
            recordsControls.classList.add('animate-electric');
        }
        
        // Animate record cards with electric spark trails
        document.querySelectorAll('.record-card').forEach(card => {
            card.classList.add('animate-electric');
        });
        
        // Animate Add Record button
        const addRecordBtn = document.querySelector('.add-record-btn');
        if (addRecordBtn) {
            addRecordBtn.classList.add('animate-electric');
        }
        
        // Apply blue energy pulse to main elements
        setTimeout(() => {
            this.applyBlueEnergyPulse();
        }, 1500);
        
    }, 500); // Delay after electric flash
}

// Add this method to create electric flash
createElectricFlash() {
    const overlay = document.createElement('div');
    overlay.className = 'electric-overlay';
    document.body.appendChild(overlay);
    
    // Remove overlay after animation
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 1200);
}

// Add this method to apply blue energy pulse
applyBlueEnergyPulse() {
    // Add continuous pulse to header
    const headerContent = document.querySelector('.header-content');
    if (headerContent) {
        headerContent.style.animation = 'blueEnergyPulse 4s ease-in-out infinite';
    }
    
    // Add pulse to summary card on hover
    const summaryCard = document.querySelector('.summary-card');
    if (summaryCard) {
        summaryCard.addEventListener('mouseenter', () => {
            summaryCard.style.animation = 'blueEnergyPulse 1.5s ease-in-out';
        });
        
        summaryCard.addEventListener('mouseleave', () => {
            summaryCard.style.animation = '';
        });
    }
}
}

// Initialize when DOM is loaded
let allTimeBest;
document.addEventListener('DOMContentLoaded', () => {
    allTimeBest = new AllTimeBest();
});