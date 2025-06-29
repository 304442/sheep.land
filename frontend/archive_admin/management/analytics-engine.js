// Analytics Engine for Sheep Farm Management System
// Provides predictive analytics and intelligent insights

class SheepFarmAnalytics {
    constructor() {
        this.data = sfmData;
    }
    
    // Predict next lambing date based on historical data
    predictLambingDate(matingId) {
        const mating = this.data.matings.find(m => m.id === matingId);
        if (!mating) return null;
        
        // Get ewe's historical gestation periods
        const ewe = this.data.animals.find(a => a.id === mating.eweId);
        const historicalLambings = this.data.lambings.filter(l => l.damId === mating.eweId);
        const historicalMatings = this.data.matings.filter(m => 
            m.eweId === mating.eweId && 
            m.status === 'lambed' &&
            m.id !== matingId
        );
        
        // Calculate gestation periods
        const gestationPeriods = [];
        historicalMatings.forEach(hm => {
            const lambing = historicalLambings.find(l => 
                Math.abs(new Date(l.date) - new Date(hm.expectedDueDate)) < 30*24*60*60*1000
            );
            if (lambing) {
                const gestation = Math.floor((new Date(lambing.date) - new Date(hm.date)) / (24*60*60*1000));
                gestationPeriods.push(gestation);
            }
        });
        
        // Calculate average and standard deviation
        const avgGestation = gestationPeriods.length > 0 
            ? gestationPeriods.reduce((a, b) => a + b) / gestationPeriods.length 
            : 150; // Default sheep gestation
            
        const stdDev = this.calculateStandardDeviation(gestationPeriods);
        
        // Predict date
        const predictedDate = new Date(mating.date);
        predictedDate.setDate(predictedDate.getDate() + Math.round(avgGestation));
        
        return {
            expectedDate: predictedDate,
            confidence: gestationPeriods.length >= 3 ? 'high' : gestationPeriods.length > 0 ? 'medium' : 'low',
            gestationDays: Math.round(avgGestation),
            rangeMin: Math.round(avgGestation - stdDev),
            rangeMax: Math.round(avgGestation + stdDev),
            basedOnRecords: gestationPeriods.length
        };
    }
    
    // Predict optimal breeding time
    predictOptimalBreedingTime(eweId) {
        const ewe = this.data.animals.find(a => a.id === eweId);
        if (!ewe || ewe.sex !== 'female') return null;
        
        // Get lambing history
        const lambings = this.data.lambings.filter(l => l.damId === eweId);
        if (lambings.length === 0) return { ready: true, reason: 'لا يوجد سجل ولادات سابق' };
        
        // Sort by date
        lambings.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastLambing = lambings[0];
        
        // Calculate days since last lambing
        const daysSinceLastLambing = Math.floor((new Date() - new Date(lastLambing.date)) / (24*60*60*1000));
        
        // Recommended waiting period (minimum 3 months)
        const minWaitingDays = 90;
        const optimalWaitingDays = 120; // 4 months for better recovery
        
        if (daysSinceLastLambing < minWaitingDays) {
            return {
                ready: false,
                daysToWait: minWaitingDays - daysSinceLastLambing,
                reason: 'فترة راحة بعد الولادة',
                lastLambingDate: lastLambing.date
            };
        }
        
        // Check body condition (based on recent weight)
        const recentWeight = this.getRecentWeight(eweId);
        const birthWeight = this.getBirthWeight(eweId);
        const expectedAdultWeight = birthWeight ? birthWeight * 10 : 40; // Rough estimate
        
        if (recentWeight && recentWeight < expectedAdultWeight * 0.8) {
            return {
                ready: false,
                reason: 'الوزن أقل من المطلوب',
                currentWeight: recentWeight,
                targetWeight: expectedAdultWeight * 0.8
            };
        }
        
        return {
            ready: true,
            daysSinceLastLambing,
            optimalScore: daysSinceLastLambing >= optimalWaitingDays ? 100 : 
                          (daysSinceLastLambing - minWaitingDays) / (optimalWaitingDays - minWaitingDays) * 100,
            reason: 'جاهزة للتزاوج'
        };
    }
    
    // Predict feed requirements
    predictFeedRequirements(days = 30) {
        const animals = this.data.animals.filter(a => a.status === 'active');
        const requirements = {
            total: 0,
            byCategory: {},
            byFeedType: {},
            cost: 0
        };
        
        animals.forEach(animal => {
            const category = this.getAnimalCategory(animal);
            const dailyRequirement = this.getDailyFeedRequirement(animal);
            
            requirements.total += dailyRequirement * days;
            
            if (!requirements.byCategory[category]) {
                requirements.byCategory[category] = 0;
            }
            requirements.byCategory[category] += dailyRequirement * days;
        });
        
        // Calculate by feed type based on rations
        if (this.data.feedRations.length > 0) {
            const defaultRation = this.data.feedRations[0];
            defaultRation.composition.forEach(comp => {
                const feedItem = this.data.inventory.find(i => i.id === comp.ingredientId);
                if (feedItem) {
                    const amount = requirements.total * (comp.percentage / 100);
                    requirements.byFeedType[feedItem.name] = amount;
                    
                    // Estimate cost
                    if (feedItem.unitCost) {
                        requirements.cost += amount * feedItem.unitCost;
                    }
                }
            });
        }
        
        // Check against current inventory
        requirements.shortages = [];
        Object.entries(requirements.byFeedType).forEach(([feedName, required]) => {
            const feedItem = this.data.inventory.find(i => i.name === feedName);
            if (feedItem && feedItem.currentStock < required) {
                requirements.shortages.push({
                    item: feedName,
                    required: required,
                    available: feedItem.currentStock,
                    shortage: required - feedItem.currentStock
                });
            }
        });
        
        return requirements;
    }
    
    // Growth rate analysis
    analyzeGrowthRate(animalId) {
        const animal = this.data.animals.find(a => a.id === animalId);
        if (!animal || !animal.weightHistory || animal.weightHistory.length < 2) {
            return null;
        }
        
        const weights = [...animal.weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
        const growthData = [];
        
        for (let i = 1; i < weights.length; i++) {
            const daysDiff = (new Date(weights[i].date) - new Date(weights[i-1].date)) / (24*60*60*1000);
            const weightGain = weights[i].weight - weights[i-1].weight;
            const dailyGain = daysDiff > 0 ? (weightGain / daysDiff) * 1000 : 0; // grams per day
            
            growthData.push({
                period: `${sfmFormatDate(weights[i-1].date)} - ${sfmFormatDate(weights[i].date)}`,
                days: Math.round(daysDiff),
                gainKg: weightGain,
                dailyGainG: Math.round(dailyGain),
                totalWeight: weights[i].weight
            });
        }
        
        // Calculate averages
        const avgDailyGain = growthData.reduce((sum, d) => sum + d.dailyGainG, 0) / growthData.length;
        const totalGain = weights[weights.length - 1].weight - weights[0].weight;
        const totalDays = (new Date(weights[weights.length - 1].date) - new Date(weights[0].date)) / (24*60*60*1000);
        
        // Predict future weight
        const predictedWeight30Days = weights[weights.length - 1].weight + (avgDailyGain * 30 / 1000);
        const predictedWeight60Days = weights[weights.length - 1].weight + (avgDailyGain * 60 / 1000);
        
        // Compare to breed standards
        const breedStandard = this.getBreedGrowthStandard(animal.breed, animal.sex);
        const performance = avgDailyGain / breedStandard.expectedDailyGain * 100;
        
        return {
            currentWeight: weights[weights.length - 1].weight,
            averageDailyGain: Math.round(avgDailyGain),
            totalGainKg: totalGain,
            totalDays: Math.round(totalDays),
            growthHistory: growthData,
            predictions: {
                weight30Days: Math.round(predictedWeight30Days * 10) / 10,
                weight60Days: Math.round(predictedWeight60Days * 10) / 10
            },
            performance: {
                score: Math.round(performance),
                rating: performance >= 90 ? 'ممتاز' : performance >= 70 ? 'جيد' : 'يحتاج تحسين',
                comparedToBreed: breedStandard.name
            }
        };
    }
    
    // Disease risk assessment
    assessDiseaseRisk() {
        const risks = [];
        const now = new Date();
        
        // Check vaccination schedules
        const animals = this.data.animals.filter(a => a.status === 'active');
        const vaccinationsDue = [];
        
        animals.forEach(animal => {
            const lastVaccination = this.data.healthRecords
                .filter(hr => hr.animalId === animal.id && hr.type === 'vaccination')
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                
            if (!lastVaccination) {
                vaccinationsDue.push(animal);
            } else {
                const daysSince = (now - new Date(lastVaccination.date)) / (24*60*60*1000);
                if (daysSince > 180) { // 6 months
                    vaccinationsDue.push(animal);
                }
            }
        });
        
        if (vaccinationsDue.length > 0) {
            risks.push({
                type: 'vaccination',
                severity: 'high',
                message: `${vaccinationsDue.length} حيوان يحتاج تحصين`,
                action: 'جدولة تحصين جماعي',
                affectedAnimals: vaccinationsDue.map(a => a.id)
            });
        }
        
        // Check for disease patterns
        const recentHealthIssues = this.data.healthRecords
            .filter(hr => hr.type === 'treatment' && 
                         (now - new Date(hr.date)) / (24*60*60*1000) < 30);
                         
        const diseaseCount = {};
        recentHealthIssues.forEach(hr => {
            if (!diseaseCount[hr.condition]) diseaseCount[hr.condition] = 0;
            diseaseCount[hr.condition]++;
        });
        
        Object.entries(diseaseCount).forEach(([disease, count]) => {
            if (count >= 3) {
                risks.push({
                    type: 'outbreak',
                    severity: count >= 5 ? 'critical' : 'medium',
                    message: `احتمال تفشي ${disease} (${count} حالات)`,
                    action: 'فحص جميع الحيوانات',
                    disease: disease
                });
            }
        });
        
        // Seasonal disease risks
        const month = now.getMonth();
        const seasonalRisks = this.getSeasonalDiseaseRisks(month);
        seasonalRisks.forEach(risk => {
            risks.push({
                type: 'seasonal',
                severity: 'medium',
                message: risk.message,
                action: risk.prevention,
                season: risk.season
            });
        });
        
        return risks;
    }
    
    // Financial analysis and predictions
    analyzeFinancialPerformance() {
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        
        // Calculate revenues
        const sales = this.data.transactions
            .filter(t => t.type === 'sale' && new Date(t.date) >= oneYearAgo);
        const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
        
        // Calculate expenses
        const expenses = this.data.transactions
            .filter(t => (t.type === 'purchase' || t.type === 'expense') && 
                        new Date(t.date) >= oneYearAgo);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        // Categorize expenses
        const expensesByCategory = {};
        expenses.forEach(e => {
            const category = this.categorizeExpense(e.description);
            if (!expensesByCategory[category]) expensesByCategory[category] = 0;
            expensesByCategory[category] += e.amount;
        });
        
        // Calculate profit margin
        const profit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        // Calculate per-animal metrics
        const avgAnimalsCount = this.getAverageAnimalCount(oneYearAgo, now);
        const revenuePerAnimal = avgAnimalsCount > 0 ? totalRevenue / avgAnimalsCount : 0;
        const costPerAnimal = avgAnimalsCount > 0 ? totalExpenses / avgAnimalsCount : 0;
        
        // Predict next period
        const monthlyRevenue = totalRevenue / 12;
        const monthlyExpenses = totalExpenses / 12;
        const predictedProfit3Months = (monthlyRevenue - monthlyExpenses) * 3;
        const predictedProfit6Months = (monthlyRevenue - monthlyExpenses) * 6;
        
        // ROI calculation
        const totalAssetValue = this.calculateTotalAssetValue();
        const roi = totalAssetValue > 0 ? (profit / totalAssetValue) * 100 : 0;
        
        return {
            period: {
                from: oneYearAgo,
                to: now
            },
            revenue: {
                total: totalRevenue,
                monthly: monthlyRevenue,
                perAnimal: revenuePerAnimal
            },
            expenses: {
                total: totalExpenses,
                monthly: monthlyExpenses,
                perAnimal: costPerAnimal,
                byCategory: expensesByCategory
            },
            profitability: {
                netProfit: profit,
                profitMargin: Math.round(profitMargin * 10) / 10,
                roi: Math.round(roi * 10) / 10
            },
            predictions: {
                profit3Months: predictedProfit3Months,
                profit6Months: predictedProfit6Months,
                breakEvenAnimals: monthlyExpenses > 0 ? Math.ceil(monthlyExpenses / (revenuePerAnimal / 12)) : 0
            },
            recommendations: this.generateFinancialRecommendations(profitMargin, expensesByCategory)
        };
    }
    
    // Helper functions
    calculateStandardDeviation(values) {
        if (values.length === 0) return 0;
        const avg = values.reduce((a, b) => a + b) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length;
        return Math.sqrt(avgSquareDiff);
    }
    
    getAnimalCategory(animal) {
        const ageMonths = this.getAgeInMonths(animal.birthDate);
        if (ageMonths < 4) return 'رضيع';
        if (ageMonths < 12) return 'نامي';
        if (animal.sex === 'female') return 'نعجة';
        return 'كبش';
    }
    
    getDailyFeedRequirement(animal) {
        const weight = this.getRecentWeight(animal.id) || 40;
        const category = this.getAnimalCategory(animal);
        
        // Basic feed calculation (2.5-3.5% of body weight)
        let percentage = 2.5;
        if (category === 'رضيع') percentage = 3.5;
        else if (category === 'نامي') percentage = 3.0;
        else if (this.isPregnant(animal.id)) percentage = 3.2;
        
        return weight * (percentage / 100);
    }
    
    getRecentWeight(animalId) {
        const animal = this.data.animals.find(a => a.id === animalId);
        if (!animal || !animal.weightHistory || animal.weightHistory.length === 0) return null;
        
        const sorted = [...animal.weightHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted[0].weight;
    }
    
    getBirthWeight(animalId) {
        const animal = this.data.animals.find(a => a.id === animalId);
        if (!animal || !animal.weightHistory) return null;
        
        const birthWeight = animal.weightHistory.find(w => w.type === 'birth');
        return birthWeight ? birthWeight.weight : null;
    }
    
    getAgeInMonths(birthDate) {
        if (!birthDate) return 0;
        const now = new Date();
        const birth = new Date(birthDate);
        return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    }
    
    isPregnant(animalId) {
        return this.data.matings.some(m => m.eweId === animalId && m.status === 'pregnant');
    }
    
    getBreedGrowthStandard(breed, sex) {
        // Default standards - should be customized per breed
        const standards = {
            'بلدي': { male: 250, female: 200 },
            'رحماني': { male: 300, female: 250 },
            'برقي': { male: 280, female: 230 },
            'عسافي': { male: 350, female: 280 }
        };
        
        const breedStandard = standards[breed] || { male: 250, female: 200 };
        const expectedDailyGain = sex === 'male' ? breedStandard.male : breedStandard.female;
        
        return {
            name: breed,
            expectedDailyGain,
            targetWeight: sex === 'male' ? 80 : 60
        };
    }
    
    getSeasonalDiseaseRisks(month) {
        const risks = [];
        
        // Summer diseases
        if (month >= 5 && month <= 8) {
            risks.push({
                season: 'صيف',
                message: 'خطر الإصابة بضربة الشمس والجفاف',
                prevention: 'توفير الظل والماء البارد'
            });
        }
        
        // Winter diseases
        if (month >= 11 || month <= 2) {
            risks.push({
                season: 'شتاء',
                message: 'خطر الالتهابات التنفسية',
                prevention: 'تحسين التهوية وتجنب الرطوبة'
            });
        }
        
        // Rainy season
        if (month >= 10 || month <= 3) {
            risks.push({
                season: 'موسم الأمطار',
                message: 'خطر الطفيليات الداخلية',
                prevention: 'برنامج مكافحة طفيليات وقائي'
            });
        }
        
        return risks;
    }
    
    categorizeExpense(description) {
        const keywords = {
            'علف': 'تغذية',
            'أعلاف': 'تغذية',
            'دواء': 'صحة',
            'بيطري': 'صحة',
            'تحصين': 'صحة',
            'عمال': 'عمالة',
            'راتب': 'عمالة',
            'كهرباء': 'مرافق',
            'ماء': 'مرافق',
            'نقل': 'نقل',
            'صيانة': 'صيانة'
        };
        
        for (const [keyword, category] of Object.entries(keywords)) {
            if (description.includes(keyword)) return category;
        }
        
        return 'أخرى';
    }
    
    getAverageAnimalCount(startDate, endDate) {
        // Simplified - counts current animals
        // Should track historical changes for accuracy
        return this.data.animals.filter(a => a.status === 'active').length;
    }
    
    calculateTotalAssetValue() {
        let total = 0;
        
        // Animal values
        this.data.animals.filter(a => a.status === 'active').forEach(animal => {
            const weight = this.getRecentWeight(animal.id) || 40;
            const pricePerKg = 100; // Should be market-based
            total += weight * pricePerKg;
        });
        
        // Equipment values
        this.data.equipment.forEach(eq => {
            if (eq.cost) {
                const age = (new Date() - new Date(eq.purchaseDate)) / (365*24*60*60*1000);
                const depreciation = Math.min(age * 0.15, 0.8); // 15% per year, max 80%
                total += eq.cost * (1 - depreciation);
            }
        });
        
        // Inventory values
        this.data.inventory.forEach(item => {
            if (item.currentStock > 0 && item.unitCost) {
                total += item.currentStock * item.unitCost;
            }
        });
        
        return total;
    }
    
    generateFinancialRecommendations(profitMargin, expensesByCategory) {
        const recommendations = [];
        
        if (profitMargin < 10) {
            recommendations.push('هامش الربح منخفض - فكر في زيادة الأسعار أو تقليل التكاليف');
        }
        
        // Find highest expense category
        const sortedExpenses = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a);
            
        if (sortedExpenses.length > 0 && sortedExpenses[0][1] > totalExpenses * 0.4) {
            recommendations.push(`تكاليف ${sortedExpenses[0][0]} تمثل أكثر من 40% - ابحث عن موردين بديلين`);
        }
        
        return recommendations;
    }
}

// Initialize analytics
const sfmAnalytics = new SheepFarmAnalytics();

// Add analytics dashboard
function showAnalyticsDashboard() {
    const content = document.createElement('div');
    content.className = 'analytics-dashboard';
    
    // Disease risks
    const risks = sfmAnalytics.assessDiseaseRisk();
    if (risks.length > 0) {
        const risksHTML = risks.map(risk => `
            <div class="alert alert-${risk.severity}">
                <strong>${risk.message}</strong>
                <p>${risk.action}</p>
            </div>
        `).join('');
        content.innerHTML += `<div class="card"><h3>تحليل المخاطر الصحية</h3>${risksHTML}</div>`;
    }
    
    // Financial analysis
    const financial = sfmAnalytics.analyzeFinancialPerformance();
    content.innerHTML += `
        <div class="card">
            <h3>التحليل المالي</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${sfmFormatCurrency(financial.revenue.total)}</div>
                    <div class="stat-label">إجمالي الإيرادات</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${sfmFormatCurrency(financial.expenses.total)}</div>
                    <div class="stat-label">إجمالي المصروفات</div>
                </div>
                <div class="stat-card ${financial.profitability.netProfit > 0 ? 'success' : 'danger'}">
                    <div class="stat-value">${sfmFormatCurrency(financial.profitability.netProfit)}</div>
                    <div class="stat-label">صافي الربح</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${financial.profitability.profitMargin}%</div>
                    <div class="stat-label">هامش الربح</div>
                </div>
            </div>
        </div>
    `;
    
    // Feed predictions
    const feedReq = sfmAnalytics.predictFeedRequirements(30);
    content.innerHTML += `
        <div class="card">
            <h3>توقعات الأعلاف (30 يوم)</h3>
            <p>إجمالي الاحتياج: ${Math.round(feedReq.total)} كجم</p>
            ${feedReq.shortages.length > 0 ? `
                <div class="alert alert-warning">
                    <strong>نقص متوقع في:</strong>
                    <ul>${feedReq.shortages.map(s => `<li>${s.item}: ${Math.round(s.shortage)} كجم</li>`).join('')}</ul>
                </div>
            ` : '<p class="text-success">المخزون كافي للفترة القادمة</p>'}
        </div>
    `;
    
    document.getElementById('reportOutputArea').innerHTML = content.innerHTML;
}

// Add predictive features to existing functions
function enhanceWithPredictions() {
    // Add prediction to mating records
    const originalRenderMating = window.renderMatingRecords;
    window.renderMatingRecords = function() {
        originalRenderMating();
        
        // Add predictions to pregnant ewes
        sfmData.matings.filter(m => m.status === 'pregnant').forEach(mating => {
            const prediction = sfmAnalytics.predictLambingDate(mating.id);
            if (prediction && prediction.confidence !== 'low') {
                // Update expected date if significantly different
                if (Math.abs(new Date(prediction.expectedDate) - new Date(mating.expectedDueDate)) > 7*24*60*60*1000) {
                }
            }
        });
    };
}

// Initialize enhancements
document.addEventListener('DOMContentLoaded', function() {
    enhanceWithPredictions();
    
    // Add analytics button to reports section
    const reportsGrid = document.querySelector('#reports .input-grid-3');
    if (reportsGrid) {
        const analyticsBtn = document.createElement('button');
        analyticsBtn.className = 'btn btn-secondary';
        analyticsBtn.textContent = 'التحليلات التنبؤية';
        analyticsBtn.onclick = showAnalyticsDashboard;
        reportsGrid.appendChild(analyticsBtn);
    }
});