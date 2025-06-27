// Feasibility Calculator Logic
function calculateFeasibility() {
    // Get input values
    const sheepCount = parseInt(document.getElementById('sheepCount').value) || 0;
    const sheepPrice = parseFloat(document.getElementById('sheepPrice').value) || 0;
    const landCost = parseFloat(document.getElementById('landCost').value) || 0;
    const equipmentCost = parseFloat(document.getElementById('equipmentCost').value) || 0;
    
    const feedCost = parseFloat(document.getElementById('feedCost').value) || 0;
    const vetCost = parseFloat(document.getElementById('vetCost').value) || 0;
    const laborCost = parseFloat(document.getElementById('laborCost').value) || 0;
    const otherCost = parseFloat(document.getElementById('otherCost').value) || 0;
    
    const breedingRate = parseFloat(document.getElementById('breedingRate').value) || 0;
    const lambPrice = parseFloat(document.getElementById('lambPrice').value) || 0;
    const woolRevenue = parseFloat(document.getElementById('woolRevenue').value) || 0;
    const analysisPeriod = parseInt(document.getElementById('analysisPeriod').value) || 1;

    // Calculate initial investment
    const totalInitialInvestment = (sheepCount * sheepPrice) + landCost + equipmentCost;
    
    // Calculate monthly operating costs
    const monthlyFeedCost = sheepCount * feedCost;
    const totalMonthlyOperating = monthlyFeedCost + vetCost + laborCost + otherCost;
    const annualOperatingCost = totalMonthlyOperating * 12;
    
    // Calculate annual revenue
    const lambsPerYear = Math.floor(sheepCount * (breedingRate / 100));
    const lambRevenue = lambsPerYear * lambPrice;
    const totalWoolRevenue = sheepCount * woolRevenue;
    const totalAnnualRevenue = lambRevenue + totalWoolRevenue;
    
    // Calculate profit
    const annualProfit = totalAnnualRevenue - annualOperatingCost;
    const totalProfit = annualProfit * analysisPeriod;
    
    // Calculate ROI
    const roi = ((totalProfit - totalInitialInvestment) / totalInitialInvestment) * 100;
    const annualROI = roi / analysisPeriod;
    
    // Calculate payback period
    let paybackPeriod = 0;
    if (annualProfit > 0) {
        paybackPeriod = totalInitialInvestment / annualProfit;
    }
    
    // Display results
    displayResults({
        totalInitialInvestment,
        totalMonthlyOperating,
        totalAnnualRevenue,
        annualProfit,
        roi: annualROI,
        paybackPeriod
    });
}

function displayResults(results) {
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
    generateRecommendation(results);
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function generateRecommendation(results) {
    const recommendationBox = document.getElementById('recommendationBox');
    let status = '';
    let statusClass = '';
    let recommendation = '';
    
    const isArabic = document.documentElement.lang === 'ar';
    
    if (results.annualProfit <= 0) {
        status = isArabic ? 'غير مربح' : 'Not Profitable';
        statusClass = 'negative';
        recommendation = isArabic ? 
            'بناءً على المعطيات المدخلة، هذا المشروع غير مربح. يُنصح بمراجعة التكاليف أو زيادة الإيرادات المتوقعة.' :
            'Based on the input parameters, this project is not profitable. Consider reducing costs or increasing revenue streams.';
    } else if (results.roi < 15) {
        status = isArabic ? 'ربحية منخفضة' : 'Low Profitability';
        statusClass = 'negative';
        recommendation = isArabic ?
            'العائد على الاستثمار منخفض. قد تحتاج إلى تحسين الكفاءة التشغيلية أو البحث عن أسواق أفضل.' :
            'The return on investment is low. You may need to improve operational efficiency or find better markets.';
    } else if (results.roi < 25) {
        status = isArabic ? 'ربحية متوسطة' : 'Moderate Profitability';
        statusClass = 'positive';
        recommendation = isArabic ?
            'المشروع يحقق ربحية معقولة. مع الإدارة الجيدة، يمكن أن يكون استثماراً مستداماً.' :
            'The project shows reasonable profitability. With good management, it can be a sustainable investment.';
    } else {
        status = isArabic ? 'ربحية عالية' : 'High Profitability';
        statusClass = 'positive';
        recommendation = isArabic ?
            'المشروع يُظهر ربحية ممتازة. هذا استثمار واعد مع إمكانية نمو جيدة.' :
            'The project shows excellent profitability. This is a promising investment with good growth potential.';
    }
    
    recommendationBox.innerHTML = `
        <h3 class="bil-spread">
            <span class="en">Investment Recommendation</span>
            <span class="ar">توصية الاستثمار</span>
        </h3>
        <div class="recommendation-status ${statusClass}">${status}</div>
        <p class="recommendation-text bil-spread">
            <span class="en">${recommendation}</span>
            <span class="ar">${recommendation}</span>
        </p>
    `;
}

// Add input validation
document.querySelectorAll('.calc-input').forEach(input => {
    input.addEventListener('input', function() {
        if (this.value < 0) {
            this.value = 0;
        }
    });
});