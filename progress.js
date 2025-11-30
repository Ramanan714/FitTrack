class ProgressTracker {
    constructor() {
        this.storage = new WorkoutStorage();
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.setupProgressHeader();
        this.populateYearSelector();
        this.renderCalendar();
        this.loadProgressData();
        this.loadWorkoutHistory();
        this.loadCurrentWH();
        this.bindEvents();
        this.updateWHButton();
        this.closeHistoryPopup();
    }

    setupProgressHeader() {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('currentProgressDate').textContent = dateString;
        
        // Set user name
        const settings = JSON.parse(localStorage.getItem('workoutTracker_settings') || '{}');
        const userName = settings.userName || 'Fitness Enthusiast';
        document.getElementById('userProgressName').textContent = `Great work, ${userName}! Let's check your progress`;
    }

    loadProgressData() {
        const workouts = this.storage.getWorkouts();
        const now = new Date();
        
        // Weekly progress (current week)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const weeklyWorkouts = this.getUniqueWorkoutDays(workouts, startOfWeek, endOfWeek);
        const weeklyRestDays = this.getRestDaysCount(startOfWeek, endOfWeek);
        const totalWeeklyDays = 7;
        const completedWeeklyDays = weeklyWorkouts.length + weeklyRestDays;
        
        // Monthly progress (current month)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = endOfMonth.getDate();
        
        const monthlyWorkouts = this.getUniqueWorkoutDays(workouts, startOfMonth, endOfMonth);
        const monthlyRestDays = this.getRestDaysCount(startOfMonth, endOfMonth);
        const completedMonthlyDays = monthlyWorkouts.length + monthlyRestDays;
        
        // Update weekly progress
        const weeklyPercent = Math.min((completedWeeklyDays / totalWeeklyDays) * 100, 100);
        this.updateProgressBar('weeklyProgressFill', weeklyPercent, 'weeklyPercent');
        document.getElementById('weeklyDays').textContent = `${completedWeeklyDays}/${totalWeeklyDays} days`;
        
        // Update monthly progress
        const monthlyPercent = Math.min((completedMonthlyDays / daysInMonth) * 100, 100);
        this.updateProgressBar('monthlyProgressFill', monthlyPercent, 'monthlyPercent');
        document.getElementById('monthlyDays').textContent = `${completedMonthlyDays}/${daysInMonth} days`;
    }

    getUniqueWorkoutDays(workouts, startDate, endDate) {
        const uniqueDays = new Set();
        workouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            if (workoutDate >= startDate && workoutDate <= endDate && workout.completed) {
                const dateKey = workoutDate.toDateString();
                uniqueDays.add(dateKey);
            }
        });
        return Array.from(uniqueDays);
    }

    getRestDaysCount(startDate, endDate) {
        let restDays = 0;
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            // Wednesday (3) and Sunday (0) are rest days
            if (dayOfWeek === 0 || dayOfWeek === 3) {
                // Only count rest days that have passed
                if (currentDate <= new Date()) {
                    restDays++;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return restDays;
    }

    updateProgressBar(barId, percent, percentId) {
        const progressBar = document.getElementById(barId);
        const percentElement = document.getElementById(percentId);
        
        progressBar.style.width = `${percent}%`;
        percentElement.textContent = `${Math.round(percent)}%`;
    }

    populateYearSelector() {
        const yearSelect = document.getElementById('yearSelect');
        const currentYear = this.currentDate.getFullYear();
        
        // Add years from 2025 to 2040
        for (let year = 2025; year <= 2040; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            option.selected = year === currentYear;
            yearSelect.appendChild(option);
        }
        
        // Set current month
        document.getElementById('monthSelect').value = this.currentDate.getMonth();
    }

    renderCalendar() {
        const year = parseInt(document.getElementById('yearSelect').value);
        const month = parseInt(document.getElementById('monthSelect').value);
        const calendar = document.getElementById('calendar');
        
        calendar.innerHTML = '';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const today = new Date();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendar.appendChild(emptyDay);
        }
        
        // Add days of the month
        const workouts = this.storage.getWorkouts();
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            const dayOfWeek = currentDate.getDay();
            
            // Determine day status
            if (currentDate > today) {
                // Future date
                dayElement.classList.add('upcoming');
            } else {
                // Past or current date
                const hasWorkout = workouts.some(workout => {
                    const workoutDate = new Date(workout.date);
                    return workoutDate.toDateString() === currentDate.toDateString() && workout.completed;
                });
                
                // Wednesday (3) and Sunday (0) are rest days
                const isRestDay = dayOfWeek === 0 || dayOfWeek === 3;
                
                if (isRestDay) {
                    dayElement.classList.add('rest');
                } else if (hasWorkout) {
                    dayElement.classList.add('completed');
                } else {
                    dayElement.classList.add('missed');
                }
            }
            
            calendar.appendChild(dayElement);
        }
    }

    loadWorkoutHistory() {
        const workouts = this.storage.getWorkouts();
        const historyList = document.getElementById('workoutHistory');
        
        historyList.innerHTML = '';
        
        // Show last 10 workouts
        const recentWorkouts = workouts
            .filter(workout => workout.completed)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        
        if (recentWorkouts.length === 0) {
            historyList.innerHTML = '<p class="no-data">No workouts recorded yet. Complete your first workout to see progress!</p>';
            return;
        }
        
        recentWorkouts.forEach(workout => {
            const historyItem = document.createElement('div');
            historyItem.className = 'workout-history-item';
            
            const date = new Date(workout.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            
            historyItem.innerHTML = `
                <div class="history-date">${date.toLocaleDateString('en-GB')}</div>
                <div class="history-day">${dayName}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    // Weight & Height Methods for Current Display
    loadCurrentWH() {
        const whData = this.getWHData();
        const currentWeight = document.getElementById('currentWeight');
        const currentHeight = document.getElementById('currentHeight');
        
        if (whData.length > 0) {
            const latest = whData[0];
            currentWeight.textContent = latest.weight;
            currentHeight.textContent = latest.height;
        } else {
            currentWeight.textContent = '--';
            currentHeight.textContent = '--';
        }
    }

    // Show History Popup
    showHistoryPopup() {
    console.log('History button clicked!'); // Debug log
    
    const popup = document.getElementById('whHistoryPopup');
    console.log('Popup element:', popup); // Debug log
    
    if (!popup) {
        console.error('Popup element not found! Check HTML ID');
        return;
    }
    
    console.log('Loading WH history data...');
    this.loadWHHistory();
    
    console.log('Adding show class to popup');
    popup.classList.add('show');
    
    console.log('Popup classes after adding show:', popup.className);
}

    // Close History Popup
    closeHistoryPopup() {
        const popup = document.getElementById('whHistoryPopup');
        popup.classList.remove('show');
    }

    // Weight & Height Methods
    updateWHButton() {
        const whData = this.getWHData();
        const button = document.getElementById('editWHBtn');
        const buttonText = document.getElementById('editWHText');
        
        if (whData.length > 0) {
            buttonText.textContent = 'Update Weight & Height';
        } else {
            buttonText.textContent = 'Add Weight & Height';
        }
    }

    getWHData() {
        return JSON.parse(localStorage.getItem('workoutTracker_wh') || '[]');
    }

    saveWHData(data) {
        localStorage.setItem('workoutTracker_wh', JSON.stringify(data));
    }

    // Load WH History for Popup
    loadWHHistory() {
        const whData = this.getWHData();
        const historyList = document.getElementById('whHistoryList');
        
        if (whData.length === 0) {
            historyList.innerHTML = '<p class="no-data">No weight & height data recorded yet.</p>';
            return;
        }
        
        historyList.innerHTML = '';
        
        // Sort by date (newest first)
        const sortedData = whData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedData.forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'wh-history-item';
            
            const date = new Date(entry.date);
            const isCurrent = index === 0;
            
            historyItem.innerHTML = `
                <div class="wh-date">${date.toLocaleDateString('en-GB')}</div>
                <div class="wh-details">
                    <div class="wh-detail">
                        <span>⚖️ ${entry.weight} kg</span>
                    </div>
                    <div class="wh-detail">
                        <span>📏 ${entry.height} cm</span>
                    </div>
                </div>
                ${isCurrent ? '<div class="current-badge">Current</div>' : ''}
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    showWHModal() {
        const whData = this.getWHData();
        const modal = document.getElementById('whModal');
        const modalTitle = document.getElementById('whModalTitle');
        const weightInput = document.getElementById('weightInput');
        const heightInput = document.getElementById('heightInput');
        
        if (whData.length > 0) {
            modalTitle.textContent = 'Update Weight & Height';
            const latest = whData[0];
            weightInput.value = latest.weight || '';
            heightInput.value = latest.height || '';
        } else {
            modalTitle.textContent = 'Add Weight & Height';
            weightInput.value = '';
            heightInput.value = '';
        }
        
        modal.classList.add('show');
    }

    closeWHModal() {
        document.getElementById('whModal').classList.remove('show');
    }

    saveWH() {
        const weight = parseFloat(document.getElementById('weightInput').value);
        const height = parseFloat(document.getElementById('heightInput').value);
        
        if (!weight || !height) {
            alert('Please enter both weight and height!');
            return;
        }
        
        if (weight < 30 || weight > 200) {
            alert('Please enter a valid weight between 30-200 kg!');
            return;
        }
        
        if (height < 100 || height > 250) {
            alert('Please enter a valid height between 100-250 cm!');
            return;
        }
        
        const whData = this.getWHData();
        const newEntry = {
            weight: weight,
            height: height,
            date: new Date().toISOString()
        };
        
        // Add new entry at the beginning
        whData.unshift(newEntry);
        this.saveWHData(whData);
        
        this.closeWHModal();
        this.loadCurrentWH(); // Update current display
        this.loadWHHistory(); // Update history popup
        this.updateWHButton();
        alert('Weight & Height saved successfully!');
    }

    resetWHForm() {
        document.getElementById('weightInput').value = '';
        document.getElementById('heightInput').value = '';
    }

    bindEvents() {
        document.getElementById('yearSelect').addEventListener('change', () => this.renderCalendar());
        document.getElementById('monthSelect').addEventListener('change', () => this.renderCalendar());
        
        // Weight & Height events for popup
        // In bindEvents method, replace the history button event listener:
document.getElementById('showHistoryBtn').addEventListener('click', (e) => {
    console.log('History button event triggered', e);
    this.showHistoryPopup();
});
        document.getElementById('closeHistoryPopup').addEventListener('click', () => this.closeHistoryPopup());
        
        // Weight & Height events
        document.getElementById('editWHBtn').addEventListener('click', () => this.showWHModal());
        document.getElementById('closeWHModal').addEventListener('click', () => this.closeWHModal());
        document.getElementById('closeWHForm').addEventListener('click', () => this.closeWHModal());
        document.getElementById('saveWHBtn').addEventListener('click', () => this.saveWH());
        document.getElementById('resetWHForm').addEventListener('click', () => this.resetWHForm());
        
        // Close modals when clicking outside
        document.getElementById('whModal').addEventListener('click', (e) => {
            if (e.target.id === 'whModal') {
                this.closeWHModal();
            }
        });
        
        // Close history popup when clicking outside
        document.getElementById('whHistoryPopup').addEventListener('click', (e) => {
            if (e.target.id === 'whHistoryPopup') {
                this.closeHistoryPopup();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProgressTracker();
});