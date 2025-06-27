// Feasibility Calculator with PocketBase Integration
function feasibilityApp() {
    return {
        // PocketBase instance
        pb: null,
        
        // State
        loading: false,
        loadingMessage: '',
        error: null,
        isAuthenticated: false,
        currentUser: null,
        savedAnalyses: [],
        canSave: false,
        
        // Form data
        formData: {
            sheepCount: 10,
            sheepPrice: 15000,
            landCost: 50000,
            equipmentCost: 25000,
            feedCost: 300,
            vetCost: 2000,
            laborCost: 5000,
            otherCost: 1000,
            breedingRate: 150,
            lambPrice: 8000,
            woolRevenue: 500,
            analysisPeriod: 3
        },
        
        // Results
        results: null,
        
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
                        await this.loadSavedAnalyses();
                    }
                }
                
                // Bind form inputs
                this.bindFormInputs();
                
            } catch (err) {
                console.error('Init error:', err);
                this.error = 'Failed to initialize. Please refresh the page.';
            }
        },
        
        // Bind form inputs to Alpine model
        bindFormInputs() {
            // Get all input elements
            const inputs = document.querySelectorAll('.calc-input');
            inputs.forEach(input => {
                const field = input.id;
                if (field && this.formData.hasOwnProperty(field)) {
                    // Set initial value
                    input.value = this.formData[field];
                    
                    // Bind to Alpine model
                    input.setAttribute('x-model', `formData.${field}`);
                }
            });
        },
        
        // Load saved analyses
        async loadSavedAnalyses() {
            try {
                this.loading = true;
                this.loadingMessage = 'Loading saved analyses...';
                
                const records = await this.pb.collection('feasibility_analyses').getList(1, 50, {
                    sort: '-created',
                    filter: `user = "${this.currentUser.id}"`
                });
                
                this.savedAnalyses = records.items;
            } catch (err) {
                console.error('Load analyses error:', err);
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
        },
        
        // Calculate feasibility
        calculateFeasibility() {
            const data = this.formData;
            
            // Calculate initial investment
            const totalInitialInvestment = (data.sheepCount * data.sheepPrice) + data.landCost + data.equipmentCost;
            
            // Calculate monthly operating costs
            const monthlyFeedCost = data.sheepCount * data.feedCost;
            const totalMonthlyOperating = monthlyFeedCost + data.vetCost + data.laborCost + data.otherCost;
            const annualOperatingCost = totalMonthlyOperating * 12;
            
            // Calculate annual revenue
            const lambsPerYear = Math.floor(data.sheepCount * (data.breedingRate / 100));
            const lambRevenue = lambsPerYear * data.lambPrice;
            const totalWoolRevenue = data.sheepCount * data.woolRevenue;
            const totalAnnualRevenue = lambRevenue + totalWoolRevenue;
            
            // Calculate profit
            const annualProfit = totalAnnualRevenue - annualOperatingCost;
            const totalProfit = annualProfit * data.analysisPeriod;
            
            // Calculate ROI
            const roi = ((totalProfit - totalInitialInvestment) / totalInitialInvestment) * 100;
            const annualROI = roi / data.analysisPeriod;
            
            // Calculate payback period
            let paybackPeriod = 0;
            if (annualProfit > 0) {
                paybackPeriod = totalInitialInvestment / annualProfit;
            }
            
            // Store results
            this.results = {
                totalInitialInvestment,
                totalMonthlyOperating,
                totalAnnualRevenue,
                annualProfit,
                roi: annualROI,
                paybackPeriod,
                lambsPerYear,
                totalWoolRevenue,
                lambRevenue
            };
            
            // Display results
            this.displayResults(this.results);
            
            // Enable save button
            this.canSave = true;
        },
        
        // Display results
        displayResults(results) {
            // Show results section
            document.getElementById('resultsSection').style.display = 'block';
            
            // Format currency
            const formatCurrency = (amount) => {
                return 'EGP ' + amount.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            };
            
            // Update values
            document.getElementById('totalInvestment').textContent = formatCurrency(results.totalInitialInvestment);
            document.getElementById('monthlyOperating').textContent = formatCurrency(results.totalMonthlyOperating);
            document.getElementById('annualRevenue').textContent = formatCurrency(results.totalAnnualRevenue);
            document.getElementById('annualProfit').textContent = formatCurrency(results.annualProfit);
            document.getElementById('roiPercentage').textContent = results.roi.toFixed(1) + '%';
            
            // Format payback period
            let paybackText = '';
            if (results.paybackPeriod <= 0) {
                paybackText = 'Not profitable';
            } else if (results.paybackPeriod < 1) {
                paybackText = Math.round(results.paybackPeriod * 12) + ' months';
            } else {
                paybackText = results.paybackPeriod.toFixed(1) + ' years';
            }
            document.getElementById('paybackPeriod').textContent = paybackText;
            
            // Generate recommendation
            this.generateRecommendation(results);
            
            // Scroll to results
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        },
        
        // Generate recommendation
        generateRecommendation(results) {
            const recommendationBox = document.getElementById('recommendationBox');
            let status = '';
            let statusClass = '';
            let recommendationEn = '';
            let recommendationAr = '';
            
            if (results.annualProfit <= 0) {
                status = 'Not Profitable / غير مربح';
                statusClass = 'negative';
                recommendationEn = 'Based on the input parameters, this project is not profitable. Consider reducing costs or increasing revenue streams.';
                recommendationAr = 'بناءً على المعطيات المدخلة، هذا المشروع غير مربح. يُنصح بمراجعة التكاليف أو زيادة الإيرادات المتوقعة.';
            } else if (results.roi < 15) {
                status = 'Low Profitability / ربحية منخفضة';
                statusClass = 'negative';
                recommendationEn = 'The return on investment is low. You may need to improve operational efficiency or find better markets.';
                recommendationAr = 'العائد على الاستثمار منخفض. قد تحتاج إلى تحسين الكفاءة التشغيلية أو البحث عن أسواق أفضل.';
            } else if (results.roi < 25) {
                status = 'Moderate Profitability / ربحية متوسطة';
                statusClass = 'positive';
                recommendationEn = 'The project shows reasonable profitability. With good management, it can be a sustainable investment.';
                recommendationAr = 'المشروع يحقق ربحية معقولة. مع الإدارة الجيدة، يمكن أن يكون استثماراً مستداماً.';
            } else {
                status = 'High Profitability / ربحية عالية';
                statusClass = 'positive';
                recommendationEn = 'The project shows excellent profitability. This is a promising investment with good growth potential.';
                recommendationAr = 'المشروع يُظهر ربحية ممتازة. هذا استثمار واعد مع إمكانية نمو جيدة.';
            }
            
            recommendationBox.innerHTML = `
                <h3 class="bil-spread">
                    <span class="en">Investment Recommendation</span>
                    <span class="ar">توصية الاستثمار</span>
                </h3>
                <div class="recommendation-status ${statusClass}">${status}</div>
                <p class="recommendation-text bil-spread">
                    <span class="en">${recommendationEn}</span>
                    <span class="ar">${recommendationAr}</span>
                </p>
            `;
        },
        
        // Save analysis
        async saveAnalysis() {
            if (!this.results || !this.isAuthenticated) return;
            
            const title = prompt('Enter a title for this analysis / أدخل عنوان لهذا التحليل:');
            if (!title) return;
            
            try {
                this.loading = true;
                this.loadingMessage = 'Saving analysis...';
                
                const record = await this.pb.collection('feasibility_analyses').create({
                    user: this.currentUser.id,
                    title: title,
                    sheep_count: this.formData.sheepCount,
                    sheep_price: this.formData.sheepPrice,
                    land_cost: this.formData.landCost,
                    equipment_cost: this.formData.equipmentCost,
                    feed_cost: this.formData.feedCost,
                    vet_cost: this.formData.vetCost,
                    labor_cost: this.formData.laborCost,
                    other_cost: this.formData.otherCost,
                    breeding_rate: this.formData.breedingRate,
                    lamb_price: this.formData.lambPrice,
                    wool_revenue: this.formData.woolRevenue,
                    analysis_period: this.formData.analysisPeriod,
                    results: this.results
                });
                
                // Reload saved analyses
                await this.loadSavedAnalyses();
                
                alert('Analysis saved successfully! / تم حفظ التحليل بنجاح!');
            } catch (err) {
                console.error('Save error:', err);
                alert('Failed to save analysis. Please try again.');
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
        },
        
        // Load analysis
        loadAnalysis(analysis) {
            // Load form data
            this.formData = {
                sheepCount: analysis.sheep_count,
                sheepPrice: analysis.sheep_price,
                landCost: analysis.land_cost,
                equipmentCost: analysis.equipment_cost,
                feedCost: analysis.feed_cost,
                vetCost: analysis.vet_cost,
                laborCost: analysis.labor_cost,
                otherCost: analysis.other_cost,
                breedingRate: analysis.breeding_rate,
                lambPrice: analysis.lamb_price,
                woolRevenue: analysis.wool_revenue,
                analysisPeriod: analysis.analysis_period
            };
            
            // Recalculate
            this.calculateFeasibility();
        },
        
        // Delete analysis
        async deleteAnalysis(id) {
            if (!confirm('Are you sure you want to delete this analysis? / هل أنت متأكد من حذف هذا التحليل؟')) {
                return;
            }
            
            try {
                this.loading = true;
                await this.pb.collection('feasibility_analyses').delete(id);
                await this.loadSavedAnalyses();
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete analysis.');
            } finally {
                this.loading = false;
            }
        },
        
        // Format date
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
}