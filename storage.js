class WorkoutStorage {
    constructor() {
        this.workoutsKey = 'workoutTracker_workouts';
        this.plansKey = 'workoutTracker_plans';
        this.recordsKey = 'workoutTracker_records';
    }
      // Profile methods
    getProfile() {
        return JSON.parse(localStorage.getItem('workoutTracker_profile') || '{}');
    }
    
    saveProfile(profileData) {
        localStorage.setItem('workoutTracker_profile', JSON.stringify(profileData));
    }

    getWorkouts() {
        return JSON.parse(localStorage.getItem(this.workoutsKey) || '[]');
    }

    saveWorkout(workout) {
        const workouts = this.getWorkouts();
        workout.id = this.generateId();
        workout.date = new Date().toISOString();
        workouts.push(workout);
        localStorage.setItem(this.workoutsKey, JSON.stringify(workouts));
        return workout;
    }

    getPlans() {
        return JSON.parse(localStorage.getItem(this.plansKey) || '[]');
    }

    savePlan(plan) {
        const plans = this.getPlans();
        plan.id = this.generateId();
        plans.push(plan);
        localStorage.setItem(this.plansKey, JSON.stringify(plans));
        return plan;
    }

    updatePlan(updatedPlan) {
        const plans = this.getPlans();
        const index = plans.findIndex(plan => plan.id === updatedPlan.id);
        if (index !== -1) {
            plans[index] = updatedPlan;
            localStorage.setItem(this.plansKey, JSON.stringify(plans));
        }
    }

    deletePlan(planId) {
        const plans = this.getPlans().filter(plan => plan.id !== planId);
        localStorage.setItem(this.plansKey, JSON.stringify(plans));
    }

    // Records methods
    getRecords() {
        return JSON.parse(localStorage.getItem(this.recordsKey) || '[]');
    }

    saveRecord(record) {
        const records = this.getRecords();
        record.id = this.generateId();
        records.push(record);
        localStorage.setItem(this.recordsKey, JSON.stringify(records));
        return record;
    }

    updateRecord(updatedRecord) {
        const records = this.getRecords();
        const index = records.findIndex(record => record.id === updatedRecord.id);
        if (index !== -1) {
            records[index] = updatedRecord;
            localStorage.setItem(this.recordsKey, JSON.stringify(records));
        }
    }

    deleteRecord(recordId) {
        const records = this.getRecords().filter(record => record.id !== recordId);
        localStorage.setItem(this.recordsKey, JSON.stringify(records));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}