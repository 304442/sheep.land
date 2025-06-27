// Farm Management System
function farmManagement() {
    return {
        // Data
        sheep: [],
        filteredSheep: [],
        filterStatus: '',
        showAddSheep: false,
        editingId: null,
        sheepForm: {
            tagId: '',
            breed: '',
            age: '',
            weight: '',
            status: 'healthy',
            lastVaccination: ''
        },
        stats: {
            totalSheep: 0,
            healthy: 0,
            pregnant: 0,
            needAttention: 0
        },

        // Initialize
        init() {
            this.loadSheep();
            this.updateStats();
        },

        // Load sheep from localStorage
        loadSheep() {
            const saved = localStorage.getItem('farm_sheep');
            if (saved) {
                this.sheep = JSON.parse(saved);
                this.filteredSheep = [...this.sheep];
            }
        },

        // Save sheep to localStorage
        saveSheepData() {
            localStorage.setItem('farm_sheep', JSON.stringify(this.sheep));
        },

        // Update statistics
        updateStats() {
            this.stats.totalSheep = this.sheep.length;
            this.stats.healthy = this.sheep.filter(s => s.status === 'healthy').length;
            this.stats.pregnant = this.sheep.filter(s => s.status === 'pregnant').length;
            this.stats.needAttention = this.sheep.filter(s => s.status === 'sick' || this.needsVaccination(s)).length;
        },

        // Check if sheep needs vaccination (more than 6 months since last)
        needsVaccination(sheep) {
            if (!sheep.lastVaccination) return true;
            const lastVac = new Date(sheep.lastVaccination);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return lastVac < sixMonthsAgo;
        },

        // Filter sheep by status
        filterSheep() {
            if (this.filterStatus) {
                this.filteredSheep = this.sheep.filter(s => s.status === this.filterStatus);
            } else {
                this.filteredSheep = [...this.sheep];
            }
        },

        // Add or update sheep
        saveSheep() {
            if (this.editingId) {
                // Update existing sheep
                const index = this.sheep.findIndex(s => s.id === this.editingId);
                if (index !== -1) {
                    this.sheep[index] = {
                        ...this.sheep[index],
                        ...this.sheepForm,
                        updatedAt: new Date().toISOString()
                    };
                }
            } else {
                // Add new sheep
                const newSheep = {
                    id: Date.now().toString(),
                    ...this.sheepForm,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.sheep.push(newSheep);
            }

            this.saveSheepData();
            this.filterSheep();
            this.updateStats();
            this.resetForm();
            this.showAddSheep = false;
        },

        // Edit sheep
        editSheep(sheep) {
            this.editingId = sheep.id;
            this.sheepForm = {
                tagId: sheep.tagId,
                breed: sheep.breed,
                age: sheep.age,
                weight: sheep.weight,
                status: sheep.status,
                lastVaccination: sheep.lastVaccination || ''
            };
            this.showAddSheep = true;
        },

        // Record health check
        recordHealth(sheep) {
            const action = prompt('Enter health action:\n1 - Mark as Healthy\n2 - Mark as Sick\n3 - Record Vaccination\n4 - Mark as Pregnant');
            
            switch(action) {
                case '1':
                    sheep.status = 'healthy';
                    break;
                case '2':
                    sheep.status = 'sick';
                    break;
                case '3':
                    sheep.lastVaccination = new Date().toISOString();
                    alert('Vaccination recorded');
                    break;
                case '4':
                    sheep.status = 'pregnant';
                    break;
                default:
                    return;
            }

            sheep.updatedAt = new Date().toISOString();
            this.saveSheepData();
            this.filterSheep();
            this.updateStats();
        },

        // Reset form
        resetForm() {
            this.editingId = null;
            this.sheepForm = {
                tagId: '',
                breed: '',
                age: '',
                weight: '',
                status: 'healthy',
                lastVaccination: ''
            };
        },

        // Format date
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
}