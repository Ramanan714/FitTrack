class AllTimeBest {
    constructor() {
        this.storage = new WorkoutStorage();
        this.records = this.getRecords();
        this.editingRecordId = null;
        this.currentSort = 'date-desc'; // Default sort by newest first
        this.init();
    }

    init() {
        this.loadRecords();
        this.bindEvents();
        this.setDefaultDate();
    }

    getRecords() {
        return JSON.parse(localStorage.getItem('workoutTracker_records') || '[]');
    }

    saveRecords() {
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
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
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
            alert('Please enter an exercise name!');
            return;
        }

        if (!recordValue || recordValue <= 0) {
            alert('Please enter a valid record value!');
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
        } else {
            // Add new record
            this.records.push(recordData);
        }

        this.saveRecords();
        this.loadRecords();
        this.closeModal();
        
        alert(`Record ${this.editingRecordId ? 'updated' : 'saved'} successfully! 🎉`);
    }

    updateRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (record) {
            this.openModal(record);
        }
    }

    deleteRecord(recordId) {
        if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
            this.records = this.records.filter(record => record.id !== recordId);
            this.saveRecords();
            this.loadRecords();
            alert('Record deleted successfully!');
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    capitalizeWords(text) {
        return text.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
}

// Initialize when DOM is loaded
let allTimeBest;
document.addEventListener('DOMContentLoaded', () => {
    allTimeBest = new AllTimeBest();
});