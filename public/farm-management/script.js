// Farm Management System with PocketBase Integration
function farmManagement() {
    return {
        // PocketBase instance
        pb: null,
        
        // State
        loading: false,
        loadingMessage: '',
        error: null,
        isAuthenticated: false,
        currentUser: null,
        
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
            lastVaccination: '',
            notes: ''
        },
        stats: {
            totalSheep: 0,
            healthy: 0,
            pregnant: 0,
            needAttention: 0
        },

        // Initialize
        async init() {
            try {
                // Initialize PocketBase
                this.pb = new PocketBase(window.location.origin);
                
                // Check authentication
                if (this.pb.authStore.isValid) {
                    this.currentUser = this.pb.authStore.model;
                    this.isAuthenticated = this.currentUser?.is_admin === true;
                    
                    if (this.isAuthenticated) {
                        await this.loadSheep();
                    }
                } else {
                    this.isAuthenticated = false;
                }
            } catch (err) {
                console.error('Init error:', err);
                this.error = 'Failed to initialize. Please refresh the page.';
            }
        },

        // Load sheep from PocketBase
        async loadSheep() {
            try {
                this.loading = true;
                this.loadingMessage = 'Loading sheep data...';
                
                const records = await this.pb.collection('farm_sheep').getList(1, 500, {
                    sort: '-created',
                    filter: `user = "${this.currentUser.id}"`
                });
                
                this.sheep = records.items;
                this.filteredSheep = [...this.sheep];
                this.updateStats();
            } catch (err) {
                console.error('Load sheep error:', err);
                this.error = 'Failed to load sheep data.';
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
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
            if (!sheep.last_vaccination) return true;
            const lastVac = new Date(sheep.last_vaccination);
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
        async saveSheep() {
            try {
                this.loading = true;
                this.loadingMessage = 'Saving sheep data...';
                
                const data = {
                    user: this.currentUser.id,
                    tag_id: this.sheepForm.tagId,
                    breed: this.sheepForm.breed,
                    age_months: parseInt(this.sheepForm.age),
                    weight_kg: parseFloat(this.sheepForm.weight),
                    status: this.sheepForm.status,
                    last_vaccination: this.sheepForm.lastVaccination || null,
                    notes: this.sheepForm.notes || ''
                };
                
                if (this.editingId) {
                    // Update existing sheep
                    await this.pb.collection('farm_sheep').update(this.editingId, data);
                } else {
                    // Add new sheep
                    await this.pb.collection('farm_sheep').create(data);
                }
                
                // Reload data
                await this.loadSheep();
                this.resetForm();
                this.showAddSheep = false;
                
                alert('Sheep data saved successfully! / تم حفظ بيانات الأغنام بنجاح!');
            } catch (err) {
                console.error('Save error:', err);
                alert('Failed to save sheep data. Please try again.');
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
        },

        // Edit sheep
        editSheep(sheep) {
            this.editingId = sheep.id;
            this.sheepForm = {
                tagId: sheep.tag_id,
                breed: sheep.breed,
                age: sheep.age_months.toString(),
                weight: sheep.weight_kg.toString(),
                status: sheep.status,
                lastVaccination: sheep.last_vaccination ? sheep.last_vaccination.split('T')[0] : '',
                notes: sheep.notes || ''
            };
            this.showAddSheep = true;
        },

        // Record health check
        async recordHealth(sheep) {
            const action = prompt('Enter health action:\n1 - Mark as Healthy\n2 - Mark as Sick\n3 - Record Vaccination\n4 - Mark as Pregnant');
            
            let updateData = {};
            let healthRecord = {
                date: new Date().toISOString(),
                action: '',
                notes: ''
            };
            
            switch(action) {
                case '1':
                    updateData.status = 'healthy';
                    healthRecord.action = 'Marked as healthy';
                    break;
                case '2':
                    updateData.status = 'sick';
                    healthRecord.action = 'Marked as sick';
                    const symptoms = prompt('Enter symptoms / أدخل الأعراض:');
                    if (symptoms) healthRecord.notes = symptoms;
                    break;
                case '3':
                    updateData.last_vaccination = new Date().toISOString();
                    healthRecord.action = 'Vaccination recorded';
                    alert('Vaccination recorded / تم تسجيل التطعيم');
                    break;
                case '4':
                    updateData.status = 'pregnant';
                    healthRecord.action = 'Marked as pregnant';
                    break;
                default:
                    return;
            }
            
            try {
                this.loading = true;
                
                // Get existing health records
                let healthRecords = sheep.health_records || [];
                if (typeof healthRecords === 'string') {
                    healthRecords = JSON.parse(healthRecords);
                }
                healthRecords.push(healthRecord);
                
                // Update sheep record
                updateData.health_records = healthRecords;
                await this.pb.collection('farm_sheep').update(sheep.id, updateData);
                
                // Reload data
                await this.loadSheep();
            } catch (err) {
                console.error('Health record error:', err);
                alert('Failed to update health record.');
            } finally {
                this.loading = false;
            }
        },

        // Delete sheep
        async deleteSheep(id) {
            if (!confirm('Are you sure you want to delete this sheep record? / هل أنت متأكد من حذف سجل هذه الأغنام؟')) {
                return;
            }
            
            try {
                this.loading = true;
                await this.pb.collection('farm_sheep').delete(id);
                await this.loadSheep();
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete sheep record.');
            } finally {
                this.loading = false;
            }
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
                lastVaccination: '',
                notes: ''
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