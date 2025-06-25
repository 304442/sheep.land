let currentSectionId = 'market';
let touchStartXCoord = 0;
let touchEndXCoord = 0;
let touchStartYCoord = 0;
let touchEndYCoord = 0; 
let isPullingToRefresh = false;
let appCharts = {}; 
let isInitialAppLoad = true;
let isLoading = false;

const appSectionOrder = ['market', 'livestock', 'infrastructure', 'operations', 'breeding', 'risks', 'seasonal', 'financial', 'multiyear', 'feedOptimizer', 'breedingCalendar', 'sensitivity', 'marketIntel', 'compliance', 'currencyConverter', 'operationalTools'];

let currentProjectData = {
    inputs: {},
    calculations: {},
    multiYearProjections: null,
    currentFeedMixData: { mix: {}, totalCostPerTon: 0, protein: 0, energy: 0, fiber: 0 },
    breedingEventsData: null,
    sensitivityAnalysisData: null,
    complianceData: {}
};

function getVal(id, isCheckbox = false, isSelect = false) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`getVal: Element with ID '${id}' not found.`); return isCheckbox ? false : (isSelect ? '' : 0); }
    if (isCheckbox) return el.checked;
    if (isSelect) return el.value;
    const value = parseFloat(el.value);
    if (el.hasAttribute('min') && parseFloat(el.getAttribute('min')) >= 0 && value < 0) { return 0; }
    return isNaN(value) ? 0 : value;
}

function getStrVal(id) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`getStrVal: Element with ID '${id}' not found.`); return ''; }
    return el.value;
}

function setVal(id, value, isReadOnly = false) {
    const el = document.getElementById(id);
    if (el) {
        el.value = (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) ? '' : value;
        if (isReadOnly && el.tagName === 'INPUT') el.readOnly = true;
    }
}

function setContent(id, content) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (content === null || content === undefined) ? '' : content;
}

function formatCurrency(num, kFormat = false, noSymbol = false) {
    if (isNaN(parseFloat(num)) || num === null || num === undefined) return noSymbol ? '0' : '0 ج.م';
    num = parseFloat(num);
    if (kFormat && Math.abs(num) >= 1000000) { return (num / 1000000).toFixed(1) + ' مليون'; }
    if (kFormat && Math.abs(num) >= 1000) { return (num / 1000).toFixed(0) + ' ألف'; }
    let formattedNum = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(num));
    return noSymbol ? formattedNum : formattedNum + (noSymbol ? '' : ' ج.م');
}

function showAppNotification(message, type = 'success') {
    const existingNotif = document.querySelector('.app-notification');
    if (existingNotif) existingNotif.remove();
    const notif = document.createElement('div');
    notif.className = 'app-notification'; notif.textContent = message;
    notif.style.cssText = `
        position: fixed; top: calc(env(safe-area-inset-top) + 80px + 10px); left: 50%; transform: translateX(-50%) translateY(-40px);
        background: ${type === 'success' ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' : (type === 'warn' ? 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)')};
        color: white; padding: 10px 20px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        font-size: 13px; font-weight: 500; z-index: 2000; opacity: 0;
        transition: opacity 0.25s ease-out, transform 0.25s ease-out; text-align: center; max-width: 90%;`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; notif.style.transform = 'translateX(-50%) translateY(0px)'; }, 10);
    setTimeout(() => { notif.style.opacity = '0'; notif.style.transform = 'translateX(-50%) translateY(-40px)'; setTimeout(() => notif.remove(), 300); }, type === 'error' ? 4500 : 2800);
}

function toggleLoading(show) {
    isLoading = show;
    const fab = document.getElementById('calculateAllFab');
    if (fab) {
        if (show) {
            fab.innerHTML = '<div class="fab-spinner"></div>'; 
            fab.disabled = true;
        } else {
            fab.innerHTML = '<span>⚡</span>';
            fab.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAppControls();
    setupGlobalEventListeners();
    initializeComplianceData(); 
    try { calculateAllFinancials(); } catch(e){ console.error("Initial calc error:",e); }
    setDefaultCurrencyValues();
    updateComplianceOverview();
    updateRamsNeededDisplay();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            const today = new Date(); const year = today.getFullYear();
            if (input.id === 'breedingSeason1StartDate') input.value = `${year}-09-01`;
            if (input.id === 'breedingSeason2StartDate') input.value = `${year+1}-04-01`;
            if (input.id === 'nearestLicenseExpiryDate') { const nextYear = new Date(new Date().setFullYear(today.getFullYear() + 1)); input.value = nextYear.toISOString().split('T')[0]; }
        }
    });
});

function initializeAppControls() {
    updateActiveNavigation();
    document.querySelectorAll('button, .nav-item').forEach(element => {
        element.addEventListener('click', function() { this.classList.add('haptic-feedback'); setTimeout(() => this.classList.remove('haptic-feedback'), 150); });
    });
    const allInputs = document.querySelectorAll('input[type="number"], input[type="date"], select, input[type="checkbox"]');
    allInputs.forEach(element => {
        let debounceTimer;
        const eventType = (element.type === 'checkbox' || element.tagName === 'SELECT' || element.type === 'date') ? 'change' : 'input';
        element.addEventListener(eventType, () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                try {
                    if (element.id.startsWith('converter')) {
                        if(element.id.includes('ToEgp')) { const currencyType = element.id.includes('Usd') ? 'usd' : (element.id.includes('Eur') ? 'eur' : 'sar'); convertForeignToEGP(currencyType); }
                        else { convertCurrencyFromEGP(); }
                    } else if (element.id.startsWith('compliance')) { updateComplianceOverview(); }
                    else if (element.id === 'cashPayingCustomersPercent') { const cashPercent = getVal('cashPayingCustomersPercent'); setVal('creditPayingCustomersPercent', Math.max(0, 100 - cashPercent)); calculateAllFinancials(); }
                    else if (element.id === 'initialEwes') { updateRamsNeededDisplay(); calculateAllFinancials(); }
                    else { calculateAllFinancials(); }
                } catch (e) { console.error("Error during input event handling for " + element.id + ":", e); showAppNotification("خطأ في تحديث البيانات.", "error");}
            }, element.type === 'number' ? 400 : 30);
        });
    });
    const landTenureEl = document.getElementById('landTenureType');
    if(landTenureEl) landTenureEl.addEventListener('change', toggleLandPurchaseInput);
    toggleLandPurchaseInput();
}

function toggleLandPurchaseInput() {
    const landTenure = getStrVal('landTenureType');
    const purchasePriceField = document.getElementById('landPurchasePriceInput')?.closest('.input-field');
    if(purchasePriceField) {
        purchasePriceField.style.display = (landTenure === 'owned') ? 'block' : 'none';
        if(landTenure !== 'owned') setVal('landPurchasePriceInput', 0);
    }
}

function updateRamsNeededDisplay() {
    const ewes = getVal('initialEwes');
    const ramsNeeded = ewes > 0 ? Math.ceil(ewes / 25) : 0;
    setVal('ramsNeededDisplay', ramsNeeded, true);
}

function setupGlobalEventListeners() {
    const contentAreaEl = document.getElementById('contentArea');
    if (!contentAreaEl) return;
    contentAreaEl.addEventListener('touchstart', handlePageTouchStart, { passive: false });
    contentAreaEl.addEventListener('touchmove', handlePageTouchMove, { passive: false });
    contentAreaEl.addEventListener('touchend', handlePageTouchEnd);
}

function handlePageTouchStart(e) {
    if (e.target.closest('.sheet-content') || e.target.closest('.chart-container canvas')) { touchStartXCoord = 0; return; }
    touchStartXCoord = e.touches[0].clientX;
    touchStartYCoord = e.touches[0].clientY;
    touchEndXCoord = e.touches[0].clientX;
    touchEndYCoord = e.touches[0].clientY;
}

function handlePageTouchMove(e) {
    if (!touchStartXCoord && !touchStartYCoord) return;
    touchEndXCoord = e.touches[0].clientX;
    touchEndYCoord = e.touches[0].clientY;
    const diffX = touchStartXCoord - touchEndXCoord;
    const diffY = touchStartYCoord - touchEndYCoord;
    const swipeLeftIndicator = document.getElementById('navSwipeLeft');
    const swipeRightIndicator = document.getElementById('navSwipeRight');

    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 20) {
        if (e.cancelable) e.preventDefault();
        if (diffX > 0) { if(swipeRightIndicator) swipeRightIndicator.classList.add('active'); if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); }
        else { if(swipeLeftIndicator) swipeLeftIndicator.classList.add('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); }
    } else { if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); }

    const contentAreaEl = document.getElementById('contentArea');
    const pullToRefreshEl = document.getElementById('pagePullToRefresh');
    if (contentAreaEl && pullToRefreshEl && contentAreaEl.scrollTop <= 5 && diffY < -60 && Math.abs(diffX) < Math.abs(diffY)) {
        if (e.cancelable) e.preventDefault();
        isPullingToRefresh = true;
        pullToRefreshEl.classList.add('visible');
    }
}

function handlePageTouchEnd() {
    const swipeLeftIndicator = document.getElementById('navSwipeLeft');
    const swipeRightIndicator = document.getElementById('navSwipeRight');
    if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active');
    if(swipeRightIndicator) swipeRightIndicator.classList.remove('active');
    if (!touchStartXCoord && !touchStartYCoord) return;

    const diffX = touchStartXCoord - touchEndXCoord;
    const diffY = touchStartYCoord - touchEndYCoord;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    if (absDiffX > 60 && absDiffX > absDiffY * 1.2) {
        const currentIndex = appSectionOrder.indexOf(currentSectionId);
        if (diffX > 0 && currentIndex < appSectionOrder.length - 1) navigateToSection(appSectionOrder[currentIndex + 1], 'left');
        else if (diffX < 0 && currentIndex > 0) navigateToSection(appSectionOrder[currentIndex - 1], 'right');
    }

    const pullToRefreshEl = document.getElementById('pagePullToRefresh');
    const contentAreaEl = document.getElementById('contentArea');
    if (pullToRefreshEl && isPullingToRefresh && absDiffY > 70 && absDiffY > absDiffX && contentAreaEl && contentAreaEl.scrollTop <= 5 ) {
        pullToRefreshEl.classList.add('refreshing');
        showAppNotification("جاري تحديث البيانات...", "info");
        setTimeout(() => {
            calculateAllFinancials(false);
            pullToRefreshEl.classList.remove('visible', 'refreshing');
            isPullingToRefresh = false;
        }, 800);
    } else if (pullToRefreshEl) {
        pullToRefreshEl.classList.remove('visible');
        isPullingToRefresh = false;
    }
    touchStartXCoord = 0; touchEndXCoord = 0; touchStartYCoord = 0; touchEndYCoord = 0;
}

function navigateToSection(sectionId, direction = null) {
    const oldSection = document.querySelector('.section-page.active');
    const newSection = document.getElementById(sectionId);
    if (!newSection) { console.error("Target section not found:", sectionId); return; }
    if (oldSection && oldSection.id === sectionId && !isInitialAppLoad) return;

    newSection.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right', 'active');
    newSection.style.transform = '';

    if (oldSection && oldSection.id !== sectionId) {
        oldSection.classList.remove('active');
        if (direction === 'left') { oldSection.classList.add('slide-out-left'); newSection.style.transform = 'translateX(100%)'; }
        else if (direction === 'right') { oldSection.classList.add('slide-out-right'); newSection.style.transform = 'translateX(-100%)'; }
    }
    
    newSection.classList.add('active');
    if (direction) {
        void newSection.offsetWidth; 
        if (direction === 'left') newSection.classList.add('slide-in-right');
        else if (direction === 'right') newSection.classList.add('slide-in-left');
    } else {
        newSection.style.transform = 'translateX(0)';
    }
    
    setTimeout(() => {
        if(oldSection) oldSection.classList.remove('slide-out-left', 'slide-out-right');
        newSection.classList.remove('slide-in-left', 'slide-in-right');
        if (direction) newSection.style.transform = ''; 
    }, 350);

    currentSectionId = sectionId;
    updateActiveNavigation();
    const contentArea = document.getElementById('contentArea');
    if(contentArea) contentArea.scrollTop = 0;
    handleSectionSpecificLogic(sectionId);
}

function showSection(sectionId, direction = null) {
    const oldSectionEl = document.querySelector('.section-page.active');
    if (oldSectionEl && oldSectionEl.id === sectionId && !direction && !isInitialAppLoad) return;
    navigateToSection(sectionId, direction);
}

function updateActiveNavigation() {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    const mainSectionsForNav = ['market', 'livestock', 'infrastructure', 'financial'];
    const activeNavIndex = mainSectionsForNav.indexOf(currentSectionId);
    const moreNavBtn = document.getElementById('moreNavBtn');
    if (activeNavIndex !== -1) { document.querySelectorAll('.bottom-nav .nav-item')[activeNavIndex].classList.add('active'); if(moreNavBtn) moreNavBtn.classList.remove('active'); }
    else { if(moreNavBtn) moreNavBtn.classList.add('active'); }
}

function showBottomSheet(type) {
    const sheetId = type === 'menu' ? 'menuSheet' : (type === 'more' ? 'moreSheet' : 'detailedReportSheet');
    const sheetEl = document.getElementById(sheetId);
    const overlayEl = document.getElementById('pageOverlay');
    if (sheetEl && overlayEl) { sheetEl.classList.add('active'); overlayEl.classList.add('active'); }
}

function hideBottomSheet(type) {
    const sheetId = type === 'menu' ? 'menuSheet' : (type === 'more' ? 'moreSheet' : 'detailedReportSheet');
    const sheetEl = document.getElementById(sheetId);
    if (sheetEl) sheetEl.classList.remove('active');
    const anySheetActive = Array.from(document.querySelectorAll('.bottom-sheet')).some(s => s.classList.contains('active'));
    if (!anySheetActive) { const overlayEl = document.getElementById('pageOverlay'); if(overlayEl) overlayEl.classList.remove('active'); }
}

function hideAllSheets() {
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('active'));
    const overlayEl = document.getElementById('pageOverlay'); if(overlayEl) overlayEl.classList.remove('active');
}

async function calculateAllFinancials(fromFAB = false) {
    if (isLoading) return;
    toggleLoading(true);
    if (fromFAB) { const fabEl = document.getElementById('calculateAllFab'); if (fabEl) { fabEl.classList.add('haptic-feedback'); setTimeout(() => fabEl.classList.remove('haptic-feedback'), 150); }}
    
    await new Promise(resolve => setTimeout(resolve, 50));

    currentProjectData.inputs = {
        udheyaPriceInput: getVal('udheyaPriceInput'), meatPriceInput: getVal('meatPriceInput'), liveAnimalPriceInput: getVal('liveAnimalPriceInput'),
        cateringPricePerPerson: getVal('cateringPricePerPerson'), eventRentalPricePerDay: getVal('eventRentalPricePerDay'),
        manurePricePerTon: getVal('manurePricePerTon'), hidePricePerPiece: getVal('hidePricePerPiece'), exportPriceGulf: getVal('exportPriceGulf'),
        udheyaCustomersInput: getVal('udheyaCustomersInput'), meatCustomersDemand: getVal('meatCustomersDemand'),
        totalFamiliesInput: getVal('totalFamiliesInput'), sacrificePercentageInput: getVal('sacrificePercentageInput'),
        marketTypeSelect: getStrVal('marketTypeSelect'), cashPayingCustomersPercent: getVal('cashPayingCustomersPercent'),
        creditPayingCustomersPercent: getVal('creditPayingCustomersPercent'), collectionPeriodDays: getVal('collectionPeriodDays'),
        premiumMeatPercent: getVal('premiumMeatPercent'), goodMeatPercent: getVal('goodMeatPercent'), regularMeatPercent: getVal('regularMeatPercent'),
        competitorCountInput: getVal('competitorCountInput'), competitorFlockSizeInput: getVal('competitorFlockSizeInput'),
        competitorPriceInput: getVal('competitorPriceInput'), competitiveAdvantagePercent: getVal('competitiveAdvantagePercent'),
        marketShareTarget: getVal('marketShareTarget'), purchasingPowerGrowthRate: getVal('purchasingPowerGrowthRate'),
        udheyaPrice2021: getVal('udheyaPrice2021'), udheyaPrice2022: getVal('udheyaPrice2022'), udheyaPrice2023: getVal('udheyaPrice2023'),
        populationGrowthRate: getVal('populationGrowthRate'), initialEwes: getVal('initialEwes'), initialRams: getVal('initialRams'),
        purchaseEwePrice: getVal('purchaseEwePrice'), purchaseRamPrice: getVal('purchaseRamPrice'),
        improvedBreedPercentage: getVal('improvedBreedPercentage'), improvedRamsCountUsed: getVal('improvedRamsCountUsed'),
        improvedRamPurchaseCost: getVal('improvedRamPurchaseCost'), feedPerHeadDay: getVal('feedPerHeadDay'),
        feedPricePerTon: getVal('feedPricePerTon'), feedConversionRatio: getVal('feedConversionRatio'),
        useOptimizedFeedCostToggle: getVal('useOptimizedFeedCostToggle', true), 
        concentrateFeedPortion: getVal('concentrateFeedPortion'), greenFeedPortion: getVal('greenFeedPortion'),
        roughageFeedPortion: getVal('roughageFeedPortion'), alfalfaPricePerKg: getVal('alfalfaPricePerKg'),
        barleyPricePerKg: getVal('barleyPricePerKg'), cornPricePerKg: getVal('cornPricePerKg'),
        soybeanPricePerKg: getVal('soybeanPricePerKg'), wheatBranPricePerKg: getVal('wheatBranPricePerKg'),
        concentratePricePerKg: getVal('concentratePricePerKg'), landTenureType: getStrVal('landTenureType'),
        landAreaSqM: getVal('landAreaSqM'), annualLandRent: getVal('annualLandRent'),
        landPurchasePriceInput: getVal('landPurchasePriceInput'), 
        shelterConstructionCost: getVal('shelterConstructionCost'), fencingCost: getVal('fencingCost'),
        coveredBarnsCost: getVal('coveredBarnsCost'), openBarnsCost: getVal('openBarnsCost'),
        birthingRoomsCost: getVal('birthingRoomsCost'), vetClinicCost: getVal('vetClinicCost'),
        feedStorageShedCost: getVal('feedStorageShedCost'), waterSystemCost: getVal('waterSystemCost'),
        feedingEquipmentCost: getVal('feedingEquipmentCost'), refrigeratorsCost: getVal('refrigeratorsCost'),
        freezersCost: getVal('freezersCost'), biogasSystemCost: getVal('biogasSystemCost'),
        waterRecyclingSystemCost: getVal('waterRecyclingSystemCost'), packagingEquipmentCost: getVal('packagingEquipmentCost'),
        barnCoolingSystemsCost: getVal('barnCoolingSystemsCost'), otherMiscellaneousEquipmentCost: getVal('otherMiscellaneousEquipmentCost'),
        fixedAssetsLifespanYears: getVal('fixedAssetsLifespanYears') || 10,
        cateringGrillsCost: getVal('cateringGrillsCost'), cateringFurnitureCost: getVal('cateringFurnitureCost'),
        cateringServingWareCost: getVal('cateringServingWareCost'), portableGeneratorCost: getVal('portableGeneratorCost'),
        productPhotographyCost: getVal('productPhotographyCost'), standardVehicleCost: getVal('standardVehicleCost'),
        refrigeratedVehicleCost: getVal('refrigeratedVehicleCost'), websiteDevelopmentCost: getVal('websiteDevelopmentCost'),
        mobileAppDevelopmentCost: getVal('mobileAppDevelopmentCost'), paymentGatewaySetupCost: getVal('paymentGatewaySetupCost'),
        inventorySystemCost: getVal('inventorySystemCost'), permanentWorkersCount: getVal('permanentWorkersCount'),
        workerMonthlySalary: getVal('workerMonthlySalary'), managerMonthlySalary: getVal('managerMonthlySalary'),
        vaccinesCostPerHeadAnnual: getVal('vaccinesCostPerHeadAnnual'), vetEmergencyMonthlyBudget: getVal('vetEmergencyMonthlyBudget'),
        vetCheckupMonthlyCost: getVal('vetCheckupMonthlyCost'), utilitiesMonthlyCost: getVal('utilitiesMonthlyCost'),
        waterPricePerCubicMeter: getVal('waterPricePerCubicMeter'), marketingMonthlyCost: getVal('marketingMonthlyCost'),
        digitalMarketingMonthlyCost: getVal('digitalMarketingMonthlyCost'), insuranceAnnualCost: getVal('insuranceAnnualCost'),
        licensesAnnualCost: getVal('licensesAnnualCost'), halalCertificateAnnualCost: getVal('halalCertificateAnnualCost'),
        qualityCertificatesAnnualCost: getVal('qualityCertificatesAnnualCost'), slaughterFeePerSheep: getVal('slaughterFeePerSheep'),
        processingFeePerSheep: getVal('processingFeePerSheep'), packagingMonthlySupplyCost: getVal('packagingMonthlySupplyCost'),
        cateringStaffPerEventCost: getVal('cateringStaffPerEventCost'), deliveryMonthlyCost: getVal('deliveryMonthlyCost'),
        monthlyTransportCost: getVal('monthlyTransportCost'), meatDemandSheepMonthlyDisplay: getVal('meatDemandSheepMonthly'), 
        liveAnimalSalesMonthly: getVal('liveAnimalSalesMonthly'), cateringEventsMonthly: getVal('cateringEventsMonthly'),
        cateringPeoplePerEvent: getVal('cateringPeoplePerEvent'), eventRentalsMonthly: getVal('eventRentalsMonthly'),
        exportSheepMonthly: getVal('exportSheepMonthly'), manureProductionAnnualTonnes: getVal('manureProductionAnnualTonnes'),
        meatYieldPercentInput: getVal('meatYieldPercentInput') || 50,
        percentMalesForUdheyaInput: getVal('percentMalesForUdheyaInput') || 80,
        fertilityRatePercent: getVal('fertilityRatePercent'), birthsPerEwePerYear: getVal('birthsPerEwePerYear'),
        avgOffspringPerBirth: getVal('avgOffspringPerBirth'), maleRatioPercent: getVal('maleRatioPercent'),
        twinRatePercent: getVal('twinRatePercent'), firstBirthAgeMonths: getVal('firstBirthAgeMonths'),
        sellingWeightKg: getVal('sellingWeightKg'), lactationPeriodDays: getVal('lactationPeriodDays'),
        weaningAgeDays: getVal('weaningAgeDays'), mainBreedingSeasonSelect: getStrVal('mainBreedingSeasonSelect'),
        breedingSeason1StartMonth: getVal('breedingSeason1StartMonth'), breedingSeason2StartMonth: getVal('breedingSeason2StartMonth'),
        breedingDurationDays: getVal('breedingDurationDays'), inseminationTypeSelect: getStrVal('inseminationTypeSelect'),
        artificialInseminationCostPerEwe: getVal('artificialInseminationCostPerEwe'),
        artificialInseminationSuccessRate: getVal('artificialInseminationSuccessRate'),
        productivityIncreaseFromGenetics: getVal('productivityIncreaseFromGenetics'),
        overallMortalityRate: getVal('overallMortalityRate'), heatWaveMortalityPercent: getVal('heatWaveMortalityPercent'),
        healthEmergencyReservePercent: getVal('healthEmergencyReservePercent'), feedPriceVolatilityPercent: getVal('feedPriceVolatilityPercent'),
        sellingPriceVariationPercent: getVal('sellingPriceVariationPercent'), demandVariationPercent: getVal('demandVariationPercent'),
        supplyInterruptionDays: getVal('supplyInterruptionDays'), incomeTaxRate: getVal('incomeTaxRate'),
        vatRatePercent: getVal('vatRatePercent'), calculateZakatToggle: getVal('calculateZakatToggle', true),
        annualMunicipalFees: getVal('annualMunicipalFees'), annualChamberFees: getVal('annualChamberFees'),
        annualProducerUnionFees: getVal('annualProducerUnionFees'), naturalDisasterInsuranceCost: getVal('naturalDisasterInsuranceCost'),
        cashReserveFixed: getVal('cashReserveFixed'), requiredCashReservePercentOfOps: getVal('requiredCashReservePercentOfOps'),
        exportCertificatesCostAnnual: getVal('exportCertificatesCostAnnual'), isoCertificateCostAnnual: getVal('isoCertificateCostAnnual'),
        onlinePlatformFeesAnnual: getVal('onlinePlatformFeesAnnual'), shippingPerHeadExport: getVal('shippingPerHeadExport'),
        eidSalesPercent: getVal('eidSalesPercent'), ramadanPriceIncreasePercent: getVal('ramadanPriceIncreasePercent'),
        hajjPriceIncreasePercent: getVal('hajjPriceIncreasePercent'), summerPriceDecreasePercent: getVal('summerPriceDecreasePercent'),
        summerCateringIncreasePercent: getVal('summerCateringIncreasePercent'), winterDemandDecreasePercent: getVal('winterDemandDecreasePercent'),
        opDiseaseTypeSelect: getStrVal('opDiseaseTypeSelect'), opInfectionRate: getVal('opInfectionRate'),
        opDiseaseMortalityRate: getVal('opDiseaseMortalityRate'), opTreatmentCostPerHead: getVal('opTreatmentCostPerHead'),
        opWeightLossDueToDisease: getVal('opWeightLossDueToDisease'), opRecoveryDays: getVal('opRecoveryDays'),
        opCurrentWorkers: getVal('opCurrentWorkers'), opWorkHoursPerDay: getVal('opWorkHoursPerDay'),
        opWorkDaysPerWeek: getVal('opWorkDaysPerWeek'), opSheepPerWorkerRatio: getVal('opSheepPerWorkerRatio'),
        opOvertimeHoursPerWeek: getVal('opOvertimeHoursPerWeek'), opOvertimePayRatePercent: getVal('opOvertimePayRatePercent')
    };
    const i = currentProjectData.inputs;

    try {
        const flockPurchaseCost = (i.initialEwes * i.purchaseEwePrice) + (i.initialRams * i.purchaseRamPrice) + (i.improvedRamsCountUsed * i.improvedRamPurchaseCost);
        let landCostInitial = (i.landTenureType === 'owned') ? i.landPurchasePriceInput : 0;
        const buildingCosts = i.shelterConstructionCost + i.fencingCost + i.coveredBarnsCost + i.openBarnsCost + i.birthingRoomsCost + i.vetClinicCost + i.feedStorageShedCost;
        const equipmentCosts = i.waterSystemCost + i.feedingEquipmentCost + i.refrigeratorsCost + i.freezersCost + i.biogasSystemCost + i.waterRecyclingSystemCost + i.packagingEquipmentCost + i.barnCoolingSystemsCost + i.otherMiscellaneousEquipmentCost;
        const cateringCapitalCosts = i.cateringGrillsCost + i.cateringFurnitureCost + i.cateringServingWareCost + i.portableGeneratorCost + i.productPhotographyCost;
        const vehiclePurchaseCosts = i.standardVehicleCost + i.refrigeratedVehicleCost;
        const techSetupCosts = i.websiteDevelopmentCost + i.mobileAppDevelopmentCost + i.paymentGatewaySetupCost + i.inventorySystemCost;
        const initialCertificationCosts = i.exportCertificatesCostAnnual + i.isoCertificateCostAnnual;
        const totalDepreciableAssets = buildingCosts + equipmentCosts + cateringCapitalCosts + vehiclePurchaseCosts + techSetupCosts + initialCertificationCosts;
        const totalFixedAssets = landCostInitial + totalDepreciableAssets;
        const annualDepreciation = i.fixedAssetsLifespanYears > 0 ? totalDepreciableAssets / i.fixedAssetsLifespanYears : 0;
        const totalAnimalsYear1 = i.initialEwes + i.initialRams + i.improvedRamsCountUsed;
        const annualLaborCost = ((i.permanentWorkersCount * i.workerMonthlySalary) + i.managerMonthlySalary) * 12;
        let effectiveFeedPricePerTon = i.feedPricePerTon;
        if (i.useOptimizedFeedCostToggle && currentProjectData.currentFeedMixData && currentProjectData.currentFeedMixData.totalCostPerTon > 0) { effectiveFeedPricePerTon = currentProjectData.currentFeedMixData.totalCostPerTon; setVal('feedPricePerTon', effectiveFeedPricePerTon); }
        const annualFeedCost = totalAnimalsYear1 * i.feedPerHeadDay * 365 * (effectiveFeedPricePerTon / 1000);
        const avgDailyWaterPerHeadLiters = 8;
        const annualWaterConsumptionCubicMeters = (totalAnimalsYear1 * avgDailyWaterPerHeadLiters * 365) / 1000;
        const annualWaterDirectCost = i.waterPricePerCubicMeter > 0 ? annualWaterConsumptionCubicMeters * i.waterPricePerCubicMeter : 0;
        const annualUtilitiesCost = (i.utilitiesMonthlyCost * 12) + annualWaterDirectCost;
        const annualVetCost = (totalAnimalsYear1 * i.vaccinesCostPerHeadAnnual) + (i.vetEmergencyMonthlyBudget * 12) + (i.vetCheckupMonthlyCost * 12);
        const annualMarketingCost = (i.marketingMonthlyCost + i.digitalMarketingMonthlyCost) * 12;
        const avgLiveWeightKg = i.sellingWeightKg; const meatYield = i.meatYieldPercentInput / 100;
        const sheepForMonthlyMeatDemand = (i.meatCustomersDemand > 0 && avgLiveWeightKg > 0 && meatYield > 0) ? (i.meatCustomersDemand / (avgLiveWeightKg * meatYield)) : 0;
        setVal('meatDemandSheepMonthly', Math.ceil(sheepForMonthlyMeatDemand));
        const annuallySlaughteredForMeat = sheepForMonthlyMeatDemand * 12;
        const sellableLambsPerYear = i.initialEwes * (i.fertilityRatePercent / 100) * i.birthsPerEwePerYear * i.avgOffspringPerBirth * (1 - ((i.overallMortalityRate + i.heatWaveMortalityPercent) / 100));
        const maleLambs = sellableLambsPerYear * (i.maleRatioPercent / 100);
        const udheyaCandidates = maleLambs * (i.percentMalesForUdheyaInput / 100);
        const udheyaSold = Math.min(udheyaCandidates, i.udheyaCustomersInput);
        const annuallySlaughteredForUdheya = udheyaSold * 0.8;
        const annuallySlaughteredForExport = i.exportSheepMonthly * 12 * 0.5;
        const totalAnnualSlaughtered = annuallySlaughteredForMeat + annuallySlaughteredForUdheya + annuallySlaughteredForExport;
        const annualSlaughterProcessingCost = totalAnnualSlaughtered * (i.slaughterFeePerSheep + i.processingFeePerSheep);
        const annualPackagingSupplyCost = i.packagingMonthlySupplyCost * 12;
        const annualCateringStaffCost = i.cateringEventsMonthly * 12 * i.cateringStaffPerEventCost;
        const annualDeliveryCost = i.deliveryMonthlyCost * 12;
        const annualExternalTransportCost = (i.standardVehicleCost === 0 && i.refrigeratedVehicleCost === 0) ? i.monthlyTransportCost * 12 : 0;
        const annualGeneralFees = i.annualMunicipalFees + i.annualChamberFees + i.annualProducerUnionFees + i.onlinePlatformFeesAnnual;
        const annualLicenseAndCertCostsTotal = i.licensesAnnualCost + i.halalCertificateAnnualCost + i.qualityCertificatesAnnualCost + i.exportCertificatesCostAnnual + i.isoCertificateCostAnnual; // All considered annual now for simplicity
        const totalAnnualOperatingCosts = annualLaborCost + annualFeedCost + annualUtilitiesCost + annualVetCost + annualMarketingCost +
                                       (i.landTenureType === 'rented' ? i.annualLandRent : 0) + i.insuranceAnnualCost +
                                       annualSlaughterProcessingCost + annualPackagingSupplyCost + annualCateringStaffCost +
                                       annualDeliveryCost + annualExternalTransportCost + annualGeneralFees + annualLicenseAndCertCostsTotal + i.naturalDisasterInsuranceCost;
        const monthsOfWC = i.requiredCashReservePercentOfOps > 0 ? (i.requiredCashReservePercentOfOps / 100) * 12 : 3;
        const wcFromOps = (totalAnnualOperatingCosts / 12) * monthsOfWC;
        const healthReserve = flockPurchaseCost * (i.healthEmergencyReservePercent / 100);
        const recommendedWorkingCapital = wcFromOps + i.cashReserveFixed + healthReserve;
        const finalTotalInvestment = flockPurchaseCost + totalFixedAssets + recommendedWorkingCapital;
        const udheyaRevenue = udheyaSold * i.udheyaPriceInput * (1 + i.hajjPriceIncreasePercent / 100);
        const meatRevenue = i.meatCustomersDemand * 12 * i.meatPriceInput;
        const liveAnimalsSoldTotal = i.liveAnimalSalesMonthly * 12;
        const liveAnimalRevenue = liveAnimalsSoldTotal * i.liveAnimalPriceInput;
        const cateringRevenue = i.cateringEventsMonthly * 12 * i.cateringPeoplePerEvent * i.cateringPricePerPerson;
        const eventRentalRevenue = i.eventRentalsMonthly * 12 * i.eventRentalPricePerDay;
        const exportRevenueNet = (i.exportSheepMonthly * 12 * i.exportPriceGulf) - (i.exportSheepMonthly * 12 * i.shippingPerHeadExport);
        const manureRevenue = i.manureProductionAnnualTonnes * i.manurePricePerTon;
        const hidesSoldTotal = totalAnnualSlaughtered;
        const hideRevenue = hidesSoldTotal * i.hidePricePerPiece;
        const totalAnnualRevenue = udheyaRevenue + meatRevenue + liveAnimalRevenue + cateringRevenue + eventRentalRevenue + exportRevenueNet + manureRevenue + hideRevenue;
        const grossProfitBeforeDepreciation = totalAnnualRevenue - totalAnnualOperatingCosts;
        let zakatAmount = 0;
        if (i.calculateZakatToggle) { const zakatSheepCount = totalAnimalsYear1; const zakatDueSheep = zakatSheepCount >= 40 ? Math.floor(zakatSheepCount / 40) : 0; zakatAmount = zakatDueSheep * i.purchaseEwePrice; }
        const taxableProfit = grossProfitBeforeDepreciation - annualDepreciation - zakatAmount;
        const incomeTaxAmount = taxableProfit > 0 ? taxableProfit * (i.incomeTaxRate / 100) : 0;
        const netAnnualProfit = grossProfitBeforeDepreciation - zakatAmount - incomeTaxAmount;
        const roi = finalTotalInvestment > 0 ? (netAnnualProfit / finalTotalInvestment) * 100 : 0;
        const profitMargin = totalAnnualRevenue > 0 ? (netAnnualProfit / totalAnnualRevenue) * 100 : 0;
        let paybackPeriodMonths = "N/A";
        if (netAnnualProfit > 0) paybackPeriodMonths = Math.ceil(finalTotalInvestment / (netAnnualProfit/12));

        currentProjectData.calculations = {
            finalTotalInvestment, totalAnnualRevenue, totalAnnualOperatingCosts, netAnnualProfit, roi: roi || 0, profitMargin: profitMargin || 0,
            paybackPeriodMonths, flockPurchaseCost, totalFixedAssets, totalDepreciableAssets, annualDepreciation, recommendedWorkingCapital, grossProfitBeforeDepreciation, zakatAmount, incomeTaxAmount,
            udheyaRevenue, meatRevenue, liveAnimalRevenue, cateringRevenue, eventRentalRevenue, exportRevenue: exportRevenueNet,
            byproductsRevenue: manureRevenue + hideRevenue, buildingCosts, equipmentCosts, cateringCapitalCosts, vehiclePurchaseCosts, techSetupCosts, initialCertificationCosts
        };
        const calc = currentProjectData.calculations;

        setContent('quickROI', (calc.roi || 0).toFixed(1) + '%');
        setContent('quickBreakEven', calc.paybackPeriodMonths !== "N/A" ? calc.paybackPeriodMonths : '∞');
        setContent('quickProfit', formatCurrency(calc.netAnnualProfit, true, false));
        setContent('quickInvestment', formatCurrency(calc.finalTotalInvestment, true, false));
        setContent('quickTotalRevenue', formatCurrency(calc.totalAnnualRevenue, true, false));
        setContent('quickProfitMargin', (calc.profitMargin || 0).toFixed(1) + '%');
        setContent('quickRequiredCashReserve', formatCurrency(calc.recommendedWorkingCapital, true, false));

        const projectStatusEl = document.getElementById('projectStatus');
        if (projectStatusEl) {
             if (calc.roi > 25 && calc.paybackPeriodMonths <= 24 && calc.paybackPeriodMonths !== "N/A") { projectStatusEl.textContent = '🎉 مشروع واعد جداً!'; projectStatusEl.style.color = '#27ae60'; }
             else if (calc.roi > 15 || (calc.paybackPeriodMonths <= 36 && calc.paybackPeriodMonths !== "N/A")) { projectStatusEl.textContent = '✅ مشروع جيد.'; projectStatusEl.style.color = '#3498db'; }
             else if (calc.roi > 5) { projectStatusEl.textContent = '⚠️ متوسط - يحتاج دراسة.'; projectStatusEl.style.color = '#f39c12'; }
             else { projectStatusEl.textContent = '❌ ضعيف - غير مجدي حالياً.'; projectStatusEl.style.color = '#e74c3c'; }
        }
        setContent('financialTotalInvestment', formatCurrency(calc.finalTotalInvestment, false, true));
        setContent('financialAnnualRevenue', formatCurrency(calc.totalAnnualRevenue, false, true));
        setContent('financialAnnualProfit', formatCurrency(calc.netAnnualProfit, false, true));
        setContent('financialROI', (calc.roi || 0).toFixed(1) + '%');
        setContent('financialBreakevenMonths', calc.paybackPeriodMonths !== "N/A" ? calc.paybackPeriodMonths : '∞');
        setContent('financialProfitMargin', (calc.profitMargin || 0).toFixed(1) + '%');
        setContent('financialAnnualOperatingCosts', formatCurrency(calc.totalAnnualOperatingCosts, false, true));
        setContent('financialPaybackPeriod', calc.paybackPeriodMonths !== "N/A" ? calc.paybackPeriodMonths : '∞');
        const decisionBox = document.getElementById('financialDecisionBox');
        if (decisionBox) {
            if (calc.roi > 20 && calc.paybackPeriodMonths !== "N/A" && calc.paybackPeriodMonths <= 24) { decisionBox.textContent = '✅ قرار استثماري ممتاز!'; decisionBox.className = 'decision-box go'; }
            else if (calc.roi > 10 && calc.paybackPeriodMonths !== "N/A" && calc.paybackPeriodMonths <= 36) { decisionBox.textContent = '⚠️ قرار جيد مع تحفظات.'; decisionBox.className = 'decision-box maybe'; }
            else { decisionBox.textContent = '❌ قرار استثماري ضعيف.'; decisionBox.className = 'decision-box no-go'; }
        }
        setContent('udheyaRevenueTotal', formatCurrency(calc.udheyaRevenue, false, true)); setContent('meatRevenueTotal', formatCurrency(calc.meatRevenue, false, true));
        setContent('liveAnimalRevenueTotal', formatCurrency(calc.liveAnimalRevenue, false, true)); setContent('cateringRevenueTotal', formatCurrency(calc.cateringRevenue, false, true));
        setContent('eventRentalRevenueTotal', formatCurrency(calc.eventRentalRevenue, false, true)); setContent('exportRevenueTotal', formatCurrency(calc.exportRevenue, false, true));
        setContent('byproductsRevenueTotal', formatCurrency(calc.byproductsRevenue, false, true));
        if (i.calculateZakatToggle) { const zakatSheepCount = i.initialEwes + i.initialRams + i.improvedRamsCountUsed; setVal('zakatDueSheepDisplay', zakatSheepCount >= 40 ? Math.floor(zakatSheepCount / 40) : 0); setVal('zakatValueDisplay', formatCurrency(calc.zakatAmount, false, true)); }
        else { setVal('zakatDueSheepDisplay', 0); setVal('zakatValueDisplay', 0); }

        handleSectionSpecificLogic(currentSectionId, true);
        if (!isInitialAppLoad) { showAppNotification('تم تحديث الحسابات ✓', 'success'); if (fromFAB && currentSectionId !== 'financial') { setTimeout(() => navigateToSection('financial'), 300); } }
        isInitialAppLoad = false;
    } catch (error) { console.error('Error in calculateAllFinancials:', error, error.stack); showAppNotification('خطأ في الحسابات. تحقق من المدخلات.', 'error'); }
    finally { toggleLoading(false); }
}

function handleSectionSpecificLogic(sectionId, forceRefresh = false) {
    if (forceRefresh || sectionId === 'financial') createMainFinancialCharts();
    if (forceRefresh || sectionId === 'seasonal') createSeasonalAnalysisCharts();
    if (forceRefresh || sectionId === 'multiyear') calculateAndDisplayMultiYearProjections();
    if (sectionId === 'feedOptimizer') { if(forceRefresh || !appCharts.feedMixComposition || !currentProjectData.currentFeedMixData.mix ) optimizeFeedMix(); createFeedMixCompositionChart(); }
    if (sectionId === 'breedingCalendar') { if(forceRefresh || !appCharts.monthlyProduction || !currentProjectData.breedingEventsData) generateBreedingSchedule(); createMonthlyProductionChart(); }
    if (sectionId === 'sensitivity') { if(forceRefresh || !appCharts.tornadoSensitivity) { runFullSensitivityAnalysis(); } createSensitivityVisuals(); }
    if (sectionId === 'marketIntel') createMarketIntelligenceCharts();
    if (sectionId === 'compliance') updateComplianceOverview();
    if (sectionId === 'operationalTools') { createOperationalKPIChart(); }
    if (sectionId === 'market' || forceRefresh) updateMarketOverviewStats();
}

function updateMarketOverviewStats() {
    const i = currentProjectData.inputs; if(!i || Object.keys(i).length === 0) return;
    const avgPrice = (i.udheyaPriceInput + i.liveAnimalPriceInput) / 2 || 0;
    setContent('avgMarketPriceDisplay', formatCurrency(avgPrice, false, true));
    const estimatedDemandUnits = i.totalFamiliesInput * (i.sacrificePercentageInput / 100);
    let demandLevelText = "منخفض";
    if (estimatedDemandUnits > 2000) demandLevelText = "مرتفع جداً";
    else if (estimatedDemandUnits > 1000) demandLevelText = "مرتفع";
    else if (estimatedDemandUnits > 300) demandLevelText = "متوسط";
    setContent('demandLevelDisplay', demandLevelText);
}

function destroyChart(chartName) { if (appCharts[chartName]) { appCharts[chartName].destroy(); delete appCharts[chartName]; }}

function createMainFinancialCharts() {
    const calc = currentProjectData.calculations; if (!calc) {destroyChart('cumulativeBreakEven'); destroyChart('mainCostBreakdown'); return;}
    destroyChart('cumulativeBreakEven');
    const cbeCtx = document.getElementById('cumulativeBreakEvenChart')?.getContext('2d');
    if (cbeCtx) {
        const paybackMonths = calc.paybackPeriodMonths === "N/A" ? 48 : parseInt(calc.paybackPeriodMonths);
        const monthsToDisplay = Math.max(24, paybackMonths + 12);
        const months = Array.from({length: monthsToDisplay}, (_, idx) => idx + 1);
        const cumulativeRevenueData = []; const cumulativeTotalCostsData = [];
        let currentRevenue = 0; let currentOpCostsCumulative = 0;
        for (let k = 0; k < months.length; k++) {
            currentRevenue += (calc.totalAnnualRevenue / 12);
            currentOpCostsCumulative += (calc.totalAnnualOperatingCosts / 12);
            cumulativeRevenueData.push(currentRevenue);
            cumulativeTotalCostsData.push(calc.finalTotalInvestment + currentOpCostsCumulative);
        }
        appCharts.cumulativeBreakEven = new Chart(cbeCtx, { type: 'line', data: { labels: months.map(m => `شهر ${m}`), datasets: [{ label: 'الإيرادات التراكمية', data: cumulativeRevenueData, borderColor: '#27ae60', tension: 0.1, fill: false, borderWidth: 2 }, { label: 'التكاليف الكلية التراكمية', data: cumulativeTotalCostsData, borderColor: '#e74c3c', tension: 0.1, fill: false, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, ticks: { callback: v => formatCurrency(v, true, true) } }}, plugins:{legend:{display:true}, title:{display:true, text:'نقطة التعادل واسترداد الاستثمار'}}} });
        setContent('breakEvenMonthsDisplay', calc.paybackPeriodMonths !== "N/A" ? calc.paybackPeriodMonths : '∞');
    }
    destroyChart('mainCostBreakdown');
    const mcbCtx = document.getElementById('mainCostBreakdownChart')?.getContext('2d');
    if (mcbCtx) {
        appCharts.mainCostBreakdown = new Chart(mcbCtx, { type: 'pie', data: { labels: ['شراء القطيع', 'أصول ثابتة', 'رأس مال عامل', 'تشغيل سنوي'], datasets: [{ data: [calc.flockPurchaseCost || 0, calc.totalFixedAssets || 0, calc.recommendedWorkingCapital || 0, calc.totalAnnualOperatingCosts || 0], backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe'], borderColor: '#fff', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title:{display:true, text:'توزيع هيكل التكاليف والاستثمار'}, tooltip: { callbacks: { label: function(context) { let label = context.label || ''; if (label) { label += ': '; } if (context.parsed !== null) { label += formatCurrency(context.parsed, false, false) ; } return label; }}}}} });
    }
}

function createSeasonalAnalysisCharts() {
    const calc = currentProjectData.calculations; const i = currentProjectData.inputs; if (!calc || !i) {destroyChart('seasonalRevenue'); destroyChart('monthlyCashFlow'); return;}
    destroyChart('seasonalRevenue');
    const srCtx = document.getElementById('seasonalRevenueChart')?.getContext('2d');
    if (srCtx) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthlyRevenueData = Array(12).fill(0);
        const nonUdheyaRevenue = calc.totalAnnualRevenue - calc.udheyaRevenue;
        const baseMonthlyNonUdheya = nonUdheyaRevenue > 0 ? nonUdheyaRevenue / 12 : 0;
        for(let m=0; m<12; m++) monthlyRevenueData[m] = baseMonthlyNonUdheya;
        const hajjMonthIndex = 6; const ramadanMonthIndex = 3; 
        monthlyRevenueData[hajjMonthIndex] += calc.udheyaRevenue * (i.eidSalesPercent / 100);
        const remainingUdheyaRev = calc.udheyaRevenue * (1 - (i.eidSalesPercent / 100));
        if (remainingUdheyaRev > 0) { for(let m=0; m<12; m++) if(m !== hajjMonthIndex) monthlyRevenueData[m] += remainingUdheyaRev / 11; }
        if (monthlyRevenueData[ramadanMonthIndex] && i.ramadanPriceIncreasePercent) monthlyRevenueData[ramadanMonthIndex] *= (1 + i.ramadanPriceIncreasePercent / 100);
        const summerMonths = [5,6,7];
        summerMonths.forEach(m => {
             if (m !== hajjMonthIndex && monthlyRevenueData[m]) { if(i.summerPriceDecreasePercent) monthlyRevenueData[m] *= (1 - i.summerPriceDecreasePercent / 100); if (calc.cateringRevenue > 0 && i.summerCateringIncreasePercent) monthlyRevenueData[m] += (calc.cateringRevenue / 12) * (i.summerCateringIncreasePercent / 100); }
             else if (m === hajjMonthIndex && monthlyRevenueData[m]) { if (calc.cateringRevenue > 0 && i.summerCateringIncreasePercent) monthlyRevenueData[m] += (calc.cateringRevenue / 12) * (i.summerCateringIncreasePercent / 100); }
        });
        const winterMonths = [0,1,11]; winterMonths.forEach(m => { if (monthlyRevenueData[m] && i.winterDemandDecreasePercent) monthlyRevenueData[m] *= (1 - i.winterDemandDecreasePercent / 100); });
        appCharts.seasonalRevenue = new Chart(srCtx, { type: 'line', data: { labels: months, datasets: [{ label: 'الإيرادات الشهرية المتوقعة', data: monthlyRevenueData, borderColor: '#667eea', tension: 0.3, fill: true, backgroundColor: 'rgba(102,126,234,0.1)' }] }, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'التغيرات الموسمية في الإيرادات'}}, scales: { y: { ticks: { callback: v => formatCurrency(v,true, true)}}}} });
        let qRevenue = [0,0,0,0]; for(let k=0; k<12; k++) qRevenue[Math.floor(k/3)] += monthlyRevenueData[k];
        const maxQRevenue = Math.max(...qRevenue); const bestQIndex = qRevenue.indexOf(maxQRevenue);
        setContent('seasonalBestQuarter', `Q${bestQIndex+1} (${formatCurrency(maxQRevenue, true, false)})`);
        setContent('seasonalUdheyaSalesPercent', calc.totalAnnualRevenue > 0 ? ((calc.udheyaRevenue / calc.totalAnnualRevenue) * 100).toFixed(1) + '%' : '0%');
    }
    destroyChart('monthlyCashFlow');
    const mcfCtx = document.getElementById('monthlyCashFlowChart')?.getContext('2d');
    if (mcfCtx && appCharts.seasonalRevenue && appCharts.seasonalRevenue.data.datasets[0].data.length === 12) {
        const monthlyOpCost = calc.totalAnnualOperatingCosts / 12;
        const monthlyRevenueDataSeries = appCharts.seasonalRevenue.data.datasets[0].data;
        let cumulativeCashFlow = -calc.finalTotalInvestment; const cashFlowSeries = [cumulativeCashFlow];
        for (let k = 0; k < 12; k++) { cumulativeCashFlow += (monthlyRevenueDataSeries[k] - monthlyOpCost); cashFlowSeries.push(cumulativeCashFlow); }
        appCharts.monthlyCashFlow = new Chart(mcfCtx, { type: 'line', data: { labels: ['استثمار', ...Array.from({length:12}, (_,j)=>`ش${j+1}`)], datasets: [{ label: 'التدفق النقدي المتراكم', data: cashFlowSeries, borderColor: '#f093fb', tension: 0.1, fill: true, backgroundColor: 'rgba(240,147,251,0.1)' }] }, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'التدفق النقدي الشهري المتراكم (السنة الأولى)'}}, scales: {y: {beginAtZero: false, ticks: {callback: v=> formatCurrency(v,true,true)}}}} });
        const minCashFlow = Math.min(...cashFlowSeries.slice(1)); const minCashFlowMonthIndex = cashFlowSeries.slice(1).indexOf(minCashFlow);
        const monthsArray = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        setContent('quickHighestCashNeedMonth', minCashFlow < 0 ? monthsArray[minCashFlowMonthIndex] : 'لا يوجد');
    } else if (mcfCtx) { mcfCtx.clearRect(0,0,mcfCtx.canvas.width, mcfCtx.canvas.height); }
}

function calculateAndDisplayMultiYearProjections() {
    const calc = currentProjectData.calculations; const inputs = currentProjectData.inputs; if (!calc || !inputs) { showAppNotification("يرجى حساب التحليل المالي أولاً.", "warn"); return; }
    const growthRate = inputs.annualFlockGrowthRate / 100; const costInflation = inputs.annualCostInflationRate / 100;
    const prodImprovement = inputs.annualProductivityImprovement / 100; const priceInflation = inputs.annualPriceInflationRate / 100;
    let currentFlock = inputs.initialEwes + inputs.initialRams + inputs.improvedRamsCountUsed;
    let currentRevenue = calc.totalAnnualRevenue; let currentOpCosts = calc.totalAnnualOperatingCosts;
    const projections = { years: [], flock: [], revenue: [], opCosts: [], netProfit: [], investment: [] };
    projections.years.push(`السنة 1`); projections.flock.push(Math.round(currentFlock)); projections.revenue.push(Math.round(currentRevenue)); projections.opCosts.push(Math.round(currentOpCosts)); projections.netProfit.push(Math.round(calc.netAnnualProfit)); projections.investment.push(calc.totalFixedAssets);
    for (let y = 2; y <= 5; y++) {
        currentFlock *= (1 + growthRate); currentRevenue *= (1 + growthRate + prodImprovement + priceInflation); currentOpCosts *= (1 + growthRate + costInflation);
        let yearInvestment = 0; if (y === 2) yearInvestment = inputs.expansionYear2Cost; if (y === 3) yearInvestment = inputs.expansionYear3Cost; if (y === 5) yearInvestment = inputs.expansionYear5Cost;
        let grossProfitY = currentRevenue - currentOpCosts - yearInvestment; let zakatY = 0;
        if (inputs.calculateZakatToggle) { const zakatDueSheepY = currentFlock >= 40 ? Math.floor(currentFlock / 40) : 0; zakatY = zakatDueSheepY * inputs.purchaseEwePrice; }
        let profitBeforeTaxY = grossProfitY - zakatY; let taxY = profitBeforeTaxY > 0 ? profitBeforeTaxY * (inputs.incomeTaxRate/100) : 0; let netProfitY = profitBeforeTaxY - taxY;
        projections.years.push(`السنة ${y}`); projections.flock.push(Math.round(currentFlock)); projections.revenue.push(Math.round(currentRevenue)); projections.opCosts.push(Math.round(currentOpCosts)); projections.netProfit.push(Math.round(netProfitY)); projections.investment.push(yearInvestment);
    }
    currentProjectData.multiYearProjections = projections;
    destroyChart('multiYearFlockGrowth');
    const mfgCtx = document.getElementById('multiYearFlockGrowthChart')?.getContext('2d');
    if (mfgCtx) { appCharts.multiYearFlockGrowth = new Chart(mfgCtx, { type: 'bar', data: { labels: projections.years, datasets: [{ label: 'حجم القطيع', data: projections.flock, backgroundColor: '#764ba2' }] }, options: { responsive: true, maintainAspectRatio: false, scales: {y:{ticks:{callback:v=>formatCurrency(v,false,true), precision:0}}}} }); }
    destroyChart('multiYearRevenueProfit');
    const mrpCtx = document.getElementById('multiYearRevenueProfitChart')?.getContext('2d');
    if (mrpCtx) { appCharts.multiYearRevenueProfit = new Chart(mrpCtx, { type: 'line', data: { labels: projections.years, datasets: [ { label: 'الإيرادات', data: projections.revenue, borderColor: '#667eea', fill:false, yAxisID: 'yRevenue' }, { label: 'الأرباح الصافية', data: projections.netProfit, borderColor: '#27ae60', fill:false, yAxisID: 'yRevenue' }, { label: 'الاستثمارات الإضافية', data: projections.investment, type: 'bar', backgroundColor: '#f39c12', yAxisID: 'yInvestment', barPercentage: 0.5 } ] }, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'التوقعات المالية والتوسعات لـ 5 سنوات'}}, scales: { yRevenue: { type: 'linear', display: true, position: 'left', title:{display:true, text:'الإيرادات والأرباح (ج.م)'}, ticks:{callback:v=>formatCurrency(v,true,true)}}, yInvestment: { type: 'linear', display: true, position: 'right', title:{display:true, text:'الاستثمارات (ج.م)'}, grid: { drawOnChartArea: false }, ticks:{callback:v=>formatCurrency(v,true,true)}}}} }); }
    const targetHeads = getVal('fiveYearTargetSheepCount'); const progress = targetHeads > 0 ? (projections.flock[4] / targetHeads) * 100 : 0;
    const expansionProgressFill = document.getElementById('expansionProgressFill');
    if (expansionProgressFill) expansionProgressFill.style.width = Math.min(100, progress).toFixed(0) + '%';
    setContent('expansionProgressPercent', Math.round(progress));
}

function optimizeFeedMix() {
    const i = currentProjectData.inputs; if(!i || Object.keys(i).length === 0) {
        setContent('optimizedFeedResults', '<p class="alert-info">يرجى إدخال بيانات المشروع أولاً.</p>');
        createFeedMixCompositionChart(); return;
    }
    const proteinReq = i.feedRequiredProtein; const energyReq = i.feedRequiredEnergy;
    const exampleMix = { feedCornPriceTon: 50, feedSoybeanPriceTon: 20, feedWheatBranPriceTon: 15, feedBarleyPriceTon: 10, feedConcentratePriceTon: 5 };
    let totalCostPerTonExample = 0; let calculatedProtein = 0; let calculatedEnergy = 0; let calculatedFiber = 0;
    const feedsData = { feedCornPriceTon: { name: 'ذرة صفراء', price: i.feedCornPriceTon, protein: 8, energy: 3.2, fiber: 2 }, feedSoybeanPriceTon: { name: 'كسب فول صويا', price: i.feedSoybeanPriceTon, protein: 44, energy: 2.2, fiber: 6 }, feedWheatBranPriceTon: { name: 'نخالة قمح', price: i.feedWheatBranPriceTon, protein: 15, energy: 2.0, fiber: 12 }, feedBarleyPriceTon: { name: 'شعير', price: i.feedBarleyPriceTon, protein: 11, energy: 2.8, fiber: 5 }, feedConcentratePriceTon: { name: 'علف مركز', price: i.feedConcentratePriceTon, protein: 18, energy: 2.7, fiber: 8 }, feedAlfalfaPriceTon: { name: 'دريس برسيم', price: i.feedAlfalfaPriceTon, protein: 17, energy: 2.2, fiber: 28 } };
    let formulaHTML = `<h4>متطلبات الخلطة:</h4> <p>بروتين خام: ${proteinReq}% | طاقة: ${energyReq} ميجا كالوري/كجم | ألياف قصوى: ${i.feedMaxFiber}%</p> <p class="alert-info">ملاحظة: هذا مثال توضيحي لخلطة شائعة، وليس حسابًا ديناميكيًا دقيقًا.</p> <p><strong>مثال لخلطة تسمين (قيم تقريبية):</strong></p> <ul style="padding-right:20px;">`;
    for (const [feedId, percent] of Object.entries(exampleMix)) {
        const feedInfo = feedsData[feedId];
        if (feedInfo) {
            formulaHTML += `<li>${feedInfo.name}: ${percent}% (سعر الطن: ${formatCurrency(feedInfo.price, false, false)})</li>`;
            totalCostPerTonExample += (percent / 100) * feedInfo.price; calculatedProtein += (percent / 100) * feedInfo.protein;
            calculatedEnergy += (percent / 100) * feedInfo.energy; calculatedFiber += (percent / 100) * feedInfo.fiber;
        }
    }
    formulaHTML += `</ul> <hr> <p><strong>إجمالي البروتين للمثال:</strong> ${calculatedProtein.toFixed(1)}%</p> <p><strong>إجمالي الطاقة للمثال:</strong> ${calculatedEnergy.toFixed(1)} MJ</p> <p><strong>إجمالي الألياف للمثال:</strong> ${calculatedFiber.toFixed(1)}%</p> <p><strong>التكلفة/طن للمثال:</strong> ${formatCurrency(totalCostPerTonExample, false, false)}</p>`;
    currentProjectData.currentFeedMixData = { mix: exampleMix, totalCostPerTon: totalCostPerTonExample, protein: calculatedProtein, energy: calculatedEnergy, fiber: calculatedFiber };
    setContent('optimizedFeedResults', formulaHTML); createFeedMixCompositionChart();
    const useOptimizedCostToggleField = document.getElementById('useOptimizedFeedCostToggleField');
    if (useOptimizedCostToggleField) useOptimizedCostToggleField.style.display = 'block';
}

function createFeedMixCompositionChart() {
    destroyChart('feedMixComposition');
    const ctx = document.getElementById('feedMixCompositionChart')?.getContext('2d');
    if (!ctx || !currentProjectData.currentFeedMixData || !currentProjectData.currentFeedMixData.mix) { if(ctx) ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height); return; }
    const { mix } = currentProjectData.currentFeedMixData;
    const feedNames = { feedCornPriceTon: 'ذرة', feedSoybeanPriceTon: 'صويا', feedWheatBranPriceTon: 'نخالة', feedBarleyPriceTon: 'شعير', feedConcentratePriceTon: 'مركز', feedAlfalfaPriceTon: 'برسيم' };
    const labels = Object.keys(mix).map(id => feedNames[id] || id.replace('PriceTon','').replace('feed',''));
    const data = Object.values(mix); const backgroundColors = ['#FFC107', '#4CAF50', '#9C27B0', '#03A9F4', '#E91E63', '#795548', '#FF9800', '#8BC34A'];
    appCharts.feedMixComposition = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: backgroundColors.slice(0, data.length), borderColor:'#fff', borderWidth:1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title:{display:true, text:'تركيبة العلف المقترحة (مثال)'}, tooltip: {callbacks: {label: (c) => `${c.label}: ${c.parsed}%`}}}} });
}

function generateBreedingSchedule() {
    const i = currentProjectData.inputs; if(!i || Object.keys(i).length === 0) { setContent('breedingEventsDisplay', '<p class="alert-info">يرجى إدخال بيانات المشروع أولاً.</p>'); createMonthlyProductionChart(); return;}
    const season1StartDateVal = getStrVal('breedingSeason1StartDate');
    const season1Start = season1StartDateVal ? new Date(season1StartDateVal) : new Date(new Date().getFullYear() + '-09-01');
    const season2StartInput = getStrVal('breedingSeason2StartDate');
    const season2Start = season2StartInput ? new Date(season2StartInput) : null;
    const duration = i.breedingDurationDays || 45; const gestation = 150; const lactation = i.lactationPeriodDays || 90;
    const events = []; function addEvent(date, name, type) { events.push({ date, name, type }); }
    addEvent(season1Start, "بدء تلقيح الموسم 1", "breeding");
    let s1BirthStart = new Date(season1Start); s1BirthStart.setDate(s1BirthStart.getDate() + gestation); addEvent(s1BirthStart, "بدء ولادات الموسم 1", "birth");
    let s1WeaningStart = new Date(s1BirthStart); s1WeaningStart.setDate(s1WeaningStart.getDate() + lactation); addEvent(s1WeaningStart, "بدء فطام مواليد الموسم 1", "weaning");
    if(season2Start && season2Start > season1Start){ addEvent(season2Start, "بدء تلقيح الموسم 2", "breeding"); let s2BirthStart = new Date(season2Start); s2BirthStart.setDate(s2BirthStart.getDate() + gestation); addEvent(s2BirthStart, "بدء ولادات الموسم 2", "birth"); let s2WeaningStart = new Date(s2BirthStart); s2WeaningStart.setDate(s2WeaningStart.getDate() + lactation); addEvent(s2WeaningStart, "بدء فطام مواليد الموسم 2", "weaning"); }
    events.sort((a,b) => a.date - b.date);
    let scheduleHTML = '<h4>أحداث التربية الرئيسية للعام القادم:</h4><ul style="list-style-type: none; padding: 0;">';
    events.forEach(ev => { scheduleHTML += `<li style="padding: 8px; border-bottom: 1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center;"><span>📅 <strong>${ev.name}</strong></span><span style="color:#555; font-size:0.9em;">${ev.date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</span></li>`; });
    scheduleHTML += '</ul>'; setContent('breedingEventsDisplay', scheduleHTML);
    currentProjectData.breedingEventsData = events; createMonthlyProductionChart();
}

function createMonthlyProductionChart() {
    destroyChart('monthlyProduction');
    const ctx = document.getElementById('monthlyProductionChart')?.getContext('2d');
    if (!ctx || !currentProjectData.breedingEventsData || !currentProjectData.inputs) { if(ctx) ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height); return; }
    const i = currentProjectData.inputs; const ewes = i.initialEwes;
    const numBirthEvents = currentProjectData.breedingEventsData.filter(e=>e.type==='birth').length || 1;
    const lambsPerBirthEventTotal = (ewes * (i.fertilityRatePercent/100) * i.birthsPerEwePerYear * i.avgOffspringPerBirth);
    const lambsPerActualBirthEvent = numBirthEvents > 0 ? lambsPerBirthEventTotal / numBirthEvents : 0;
    const monthlyBirths = Array(12).fill(0); const currentYear = new Date().getFullYear();
    currentProjectData.breedingEventsData.filter(e => e.type === 'birth').forEach(event => {
        const monthIndex = event.date.getMonth();
        if(event.date.getFullYear() === currentYear || event.date.getFullYear() === currentYear + 1) { monthlyBirths[monthIndex] += lambsPerActualBirthEvent; }
    });
    appCharts.monthlyProduction = new Chart(ctx, { type: 'bar', data: { labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'], datasets: [{ label: 'المواليد المتوقعة شهرياً', data: monthlyBirths.map(m => Math.round(m)), backgroundColor: '#4CAF50' }] }, options: { responsive: true, maintainAspectRatio: false, scales:{y:{ticks:{precision:0, beginAtZero: true}}}, plugins:{title:{display:true, text:'توزيع المواليد المتوقعة على مدار العام'}} } });
}

function runFullSensitivityAnalysis() {
    toggleLoading(true);
    setTimeout(() => {
        const calc = currentProjectData.calculations; const inputs = currentProjectData.inputs; if (!calc || !inputs) { showAppNotification("يرجى حساب التحليل المالي الأساسي أولاً.", "warn"); toggleLoading(false); return; }
        const baseProfit = calc.netAnnualProfit;
        const originalInputsSnapshot = JSON.parse(JSON.stringify(inputs));
        const factorsToVary = [ { name: 'سعر الأضحية', inputId: 'udheyaPriceInput', variationId: 'sensitivityPriceVariation' }, { name: 'سعر طن العلف', inputId: 'feedPricePerTon', variationId: 'sensitivityFeedCostVariation' }, { name: 'معدل ولادات/نعجة', inputId: 'birthsPerEwePerYear', variationId: 'sensitivityBirthRateVariation' }, { name: 'نسبة النفوق (%)', inputId: 'overallMortalityRate', variationId: 'sensitivityMortalityVariation' }, { name: 'عملاء الأضاحي', inputId: 'udheyaCustomersInput', variationId: 'sensitivityDemandVariation' } ];
        const sensitivityResults = [];
        factorsToVary.forEach(factor => {
            const baseValue = originalInputsSnapshot[factor.inputId]; const variationPercent = getVal(factor.variationId) / 100;
            let highTestValue = baseValue * (1 + variationPercent); let lowTestValue = baseValue * (1 - variationPercent);
            if (factor.inputId === 'overallMortalityRate') { highTestValue = Math.min(100, baseValue * (1 + variationPercent)); lowTestValue = Math.max(0, baseValue * (1 - variationPercent)); }
            setVal(factor.inputId, highTestValue); calculateAllFinancials(); const profitHigh = currentProjectData.calculations.netAnnualProfit;
            setVal(factor.inputId, lowTestValue); calculateAllFinancials(); const profitLow = currentProjectData.calculations.netAnnualProfit;
            sensitivityResults.push({ variable: factor.name, impactLow: profitLow - baseProfit, impactHigh: profitHigh - baseProfit, totalSwing: profitHigh - profitLow });
            setVal(factor.inputId, baseValue);
        });
        calculateAllFinancials();
        const mcRuns = getVal('monteCarloSimulationRuns'); const mcProfits = [];
        for (let k = 0; k < mcRuns; k++) {
            factorsToVary.forEach(factor => {
                const baseValue = originalInputsSnapshot[factor.inputId]; const variationPercent = getVal(factor.variationId) / 100;
                const randomFactor = 1 + (Math.random() - 0.5) * 2 * variationPercent; let variedValue = baseValue * randomFactor;
                if (factor.inputId === 'overallMortalityRate') variedValue = Math.max(0, Math.min(100, variedValue));
                setVal(factor.inputId, variedValue);
            });
            calculateAllFinancials(); mcProfits.push(currentProjectData.calculations.netAnnualProfit);
        }
        Object.entries(originalInputsSnapshot).forEach(([id, val]) => setVal(id, val)); calculateAllFinancials();
        currentProjectData.sensitivityAnalysisData = { tornado: sensitivityResults, monteCarlo: mcProfits };
        createSensitivityVisuals(); displayRiskAssessmentSummary(mcProfits, baseProfit);
        toggleLoading(false);
        showAppNotification("تم إجراء تحليل الحساسية ومونت كارلو.", "success");
    }, 50);
}

function createSensitivityVisuals() {
    const data = currentProjectData.sensitivityAnalysisData; if(!data) {destroyChart('tornadoSensitivity'); destroyChart('monteCarloProfitDistribution');return;} const { tornado, monteCarlo } = data;
    destroyChart('tornadoSensitivity');
    const tsCtx = document.getElementById('tornadoSensitivityChart')?.getContext('2d');
    if (tsCtx && tornado) {
        tornado.sort((a,b) => Math.abs(b.totalSwing) - Math.abs(a.totalSwing));
        appCharts.tornadoSensitivity = new Chart(tsCtx, { type: 'bar', data: { labels: tornado.map(s => s.variable), datasets: [ { label: 'تأثير سلبي', data: tornado.map(s => s.impactLow < 0 ? s.impactLow : 0), backgroundColor: '#e74c3c', stack: 'Stack 0' }, { label: 'تأثير إيجابي', data: tornado.map(s => s.impactHigh > 0 ? s.impactHigh : 0), backgroundColor: '#27ae60', stack: 'Stack 0' } ] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ticks:{callback: v=>formatCurrency(v,true, true)} }, y: { stacked: true, ticks:{autoSkip:false} } }, plugins:{title:{display:true, text:'تأثير المتغيرات على صافي الربح (رسم الإعصار)'}, legend:{display:false, labels:{boxWidth:10}}}} });
    }
    destroyChart('monteCarloProfitDistribution');
    const mcpCtx = document.getElementById('monteCarloProfitDistributionChart')?.getContext('2d');
    if (mcpCtx && monteCarlo && monteCarlo.length > 0) {
        const mcHistogram = {}; const numBins = 20; const minP = Math.min(...monteCarlo); const maxP = Math.max(...monteCarlo);
        const binSize = (maxP - minP) / numBins || 1; const histoLabels = []; const histoData = Array(numBins).fill(0);
        for(let k=0; k<numBins; k++) { const binStart = minP + k * binSize; histoLabels.push(`${formatCurrency(binStart, true, true)}`); }
        monteCarlo.forEach(profit => { const binIndex = Math.min(numBins - 1, Math.max(0, Math.floor((profit - minP) / binSize))); histoData[binIndex]++; });
        appCharts.monteCarloProfitDistribution = new Chart(mcpCtx, { type: 'bar', data: { labels: histoLabels, datasets: [{ label: 'تكرار الربح', data: histoData, backgroundColor: '#03A9F4'}] }, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'توزيع الأرباح المتوقعة (مونت كارلو)'}}, scales:{x:{ticks:{maxRotation:70, minRotation:45, callback:v=>v}}, y:{title:{display:true, text:'عدد مرات الحدوث'}}}} });
    } else if (mcpCtx) { mcpCtx.clearRect(0,0,mcpCtx.canvas.width, mcpCtx.canvas.height); }
}

function displayRiskAssessmentSummary(mcResults, baseProfit) {
    if (!mcResults || mcResults.length === 0) { setContent('riskAssessmentSummary', '<p class="alert-info">لا توجد بيانات كافية لتقييم المخاطر. يرجى تشغيل التحليل أولاً.</p>'); return; }
    const profitableRuns = mcResults.filter(r => r > 0).length; const profitabilityPercent = (profitableRuns / mcResults.length * 100);
    const meanProfit = mcResults.reduce((sum, r) => sum + r, 0) / mcResults.length;
    const sortedMC = [...mcResults].sort((a,b) => a - b); const p5 = sortedMC[Math.floor(mcResults.length * 0.05)]; const p95 = sortedMC[Math.floor(mcResults.length * 0.95)];
    let riskLevelText = "منخفض المخاطر"; let riskColor = "#27ae60";
    if (profitabilityPercent < 60 || p5 < (baseProfit * 0.1)) { riskLevelText = "مرتفع المخاطر"; riskColor = "#e74c3c"; }
    else if (profitabilityPercent < 85 || p5 < (baseProfit * 0.4)) { riskLevelText = "متوسط المخاطر"; riskColor = "#f39c12"; }
    setContent('riskAssessmentSummary', ` <div style="padding:10px; border-radius:8px; background-color: ${riskColor}20; border-left: 5px solid ${riskColor}; margin-bottom:15px;"> <h5 style="color:${riskColor}; margin-top:0;">مستوى المخاطرة المقدر: ${riskLevelText}</h5> <p>احتمالية تحقيق ربح (P > 0): <strong>${profitabilityPercent.toFixed(1)}%</strong></p> </div> <p>متوسط الربح المتوقع (مونت كارلو): <strong>${formatCurrency(meanProfit)}</strong></p> <p>نطاق الربح (ثقة 90%): من <strong>${formatCurrency(p5)}</strong> إلى <strong>${formatCurrency(p95)}</strong></p> <p>الربح الأساسي (بدون تقلبات): <strong>${formatCurrency(baseProfit)}</strong></p>`);
}

function createMarketIntelligenceCharts() {
    const i = currentProjectData.inputs; if(!i || Object.keys(i).length === 0) {destroyChart('marketIntelPriceTrends'); destroyChart('marketIntelDemandForecast'); return;}
    destroyChart('marketIntelPriceTrends');
    const miptCtx = document.getElementById('marketIntelPriceTrendsChart')?.getContext('2d');
    if (miptCtx) {
        const prices = [i.udheyaPrice2021, i.udheyaPrice2022, i.udheyaPrice2023, i.udheyaPriceInput];
        appCharts.marketIntelPriceTrends = new Chart(miptCtx, { type: 'line', data: { labels: ['2021', '2022', '2023', 'الحالي/متوقع'], datasets: [{ label: 'متوسط سعر الأضحية', data: prices, borderColor: '#FF9800', tension: 0.1, fill:false }] }, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'تطور أسعار الأضاحي'}}, scales:{y:{ticks:{callback:v=>formatCurrency(v, false, true)}}} } });
    }
    destroyChart('marketIntelDemandForecast');
    const midfCtx = document.getElementById('marketIntelDemandForecastChart')?.getContext('2d');
    if (midfCtx) {
        const baseDemandUnits = i.totalFamiliesInput * (i.sacrificePercentageInput / 100);
        const popGrowth = i.populationGrowthRate / 100; const purchasingGrowth = i.purchasingPowerGrowthRate / 100;
        const demandForecastData = []; let currentDemand = baseDemandUnits;
        for (let y = 0; y < 5; y++) { demandForecastData.push(Math.round(currentDemand)); currentDemand *= (1 + popGrowth + purchasingGrowth * 0.5); }
        appCharts.marketIntelDemandForecast = new Chart(midfCtx, { type: 'bar', data: { labels: ['س1', 'س2', 'س3', 'س4', 'س5'], datasets: [{ label: 'الطلب المتوقع (رؤوس أضاحي)', data: demandForecastData, backgroundColor: '#673AB7' }] }, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'توقعات نمو الطلب على الأضاحي'}}, scales:{y:{ticks:{callback:v=>formatCurrency(v,false,true), precision:0}}} } });
    }
}

function initializeComplianceData() {
    currentProjectData.complianceData = {
        complianceBusinessLicense: { name: 'رخصة مزاولة النشاط / سجل تجاري', cost: 2000, renewal: 'سنوي', checked: getVal('complianceBusinessLicense', true) },
        complianceTaxRegistration: { name: 'البطاقة الضريبية والتسجيل الضريبي', cost: 500, renewal: 'مرة واحدة', checked: getVal('complianceTaxRegistration', true) },
        complianceHealthCertificate: { name: 'شهادة صحية بيطرية للمزرعة', cost: 3000, renewal: 'سنوي', checked: getVal('complianceHealthCertificate', true) },
        complianceHalalCertificate: { name: 'شهادة الذبح الحلال', cost: 15000, renewal: 'سنوي', checked: getVal('complianceHalalCertificate', true) },
        complianceEnvironmentalPermit: { name: 'تصريح بيئي', cost: 8000, renewal: '3 سنوات', checked: getVal('complianceEnvironmentalPermit', true) },
        complianceISOCertificate: { name: 'شهادة ISO 22000', cost: 50000, renewal: '3 سنوات', checked: getVal('complianceISOCertificate', true) }
    };
}

function updateComplianceOverview() {
    let checkedCount = 0;
    const checkboxes = document.querySelectorAll('#compliance .input-label input[type="checkbox"]');
    const totalChecks = checkboxes.length;

    checkboxes.forEach(cb => {
        if (cb.checked) checkedCount++;
        if(currentProjectData.complianceData[cb.id]) { currentProjectData.complianceData[cb.id].checked = cb.checked; }
    });

    const completionRate = totalChecks > 0 ? (checkedCount / totalChecks) * 100 : 0;
    const progressFillEl = document.getElementById('mainComplianceProgressFill');
    if(progressFillEl) progressFillEl.style.width = completionRate.toFixed(0) + '%';
    setContent('mainCompliancePercent', completionRate.toFixed(0));

    destroyChart('mainCompliance');
    const mcCtx = document.getElementById('mainComplianceChart')?.getContext('2d');
    if (mcCtx) {
        appCharts.mainCompliance = new Chart(mcCtx, {
            type: 'doughnut',
            data: {
                labels: ['مكتمل', 'متبقي'],
                datasets: [{ data: [checkedCount, totalChecks - checkedCount], backgroundColor: ['#4CAF50', '#F44336'], borderColor:'#fff', borderWidth:2}]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title:{display:true, text:'حالة استيفاء التراخيص الأساسية'} }}
        });
    }
    let detailsHTML = '<ul style="list-style-type: none; padding: 0;">';
    Object.values(currentProjectData.complianceData).forEach(doc => {
        detailsHTML += `<li style="padding: 5px 0; border-bottom: 1px solid #eee;">${doc.name} - التكلفة التقديرية: ${formatCurrency(doc.cost,false,true)} (${doc.renewal}) - ${doc.checked ? "<span style='color:green;'><strong>✓</strong></span>" : "<span style='color:red;'>✗</span>"}</li>`;
    });
    detailsHTML += '</ul>';
    setContent('complianceDocumentDetails', detailsHTML);
}

function setComplianceReminder() {
    const nearestExpiry = getStrVal('nearestLicenseExpiryDate');
    if (nearestExpiry) { showAppNotification(`تم تعيين تذكير لتجديد الترخيص بتاريخ ${new Date(nearestExpiry).toLocaleDateString('ar-EG')}`, "info"); }
    else { showAppNotification("يرجى إدخال تاريخ انتهاء أقرب ترخيص.", "warn"); }
}

function convertCurrencyFromEGP() {
    const egp = getVal('converterEgpAmount'); const usdRate = getVal('converterUsdRate');
    const eurRate = getVal('converterEurRate'); const sarRate = getVal('converterSarRate');
    setContent('converterUsdEquivalent', usdRate > 0 ? formatCurrency(egp / usdRate, false, true) : '0');
    setContent('converterEurEquivalent', eurRate > 0 ? formatCurrency(egp / eurRate, false, true) : '0');
    setContent('converterSarEquivalent', sarRate > 0 ? formatCurrency(egp / sarRate, false, true) : '0');
}

function setDefaultCurrencyValues() {
     if(getVal('converterEgpAmount') === 0 && (getVal('converterUsdRate') > 0 || getVal('converterEurRate') > 0 || getVal('converterSarRate') > 0) ) { setVal('converterEgpAmount', 10000); convertCurrencyFromEGP(); }
     else if (getVal('converterEgpAmount') > 0) { convertCurrencyFromEGP(); }
}

function convertForeignToEGP(sourceCurrency) {
    let amount = 0, rate = 1;
    if (sourceCurrency === 'usd') { amount = getVal('converterUsdToEgpAmount'); rate = getVal('converterUsdRate'); }
    else if (sourceCurrency === 'eur') { amount = getVal('converterEurToEgpAmount'); rate = getVal('converterEurRate'); }
    else if (sourceCurrency === 'sar') { amount = getVal('converterSarToEgpAmount'); rate = getVal('converterSarRate'); }
    setContent('converterReverseEgpResult', formatCurrency(amount * rate, false, true));
}

function simulateDiseaseOutbreak() {
    const i = currentProjectData.inputs; if(!i || Object.keys(i).length === 0) {showAppNotification("يرجى ملء البيانات الأساسية أولاً.", "warn"); return;}
    const flockSize = i.initialEwes + i.initialRams + i.improvedRamsCountUsed;
    const infectionRate = getVal('opInfectionRate') / 100; const mortalityFromDisease = getVal('opDiseaseMortalityRate') / 100;
    const treatmentPerHead = getVal('opTreatmentCostPerHead'); const weightLossPercent = getVal('opWeightLossDueToDisease') / 100;
    const avgAnimalValue = i.purchaseEwePrice; const infected = Math.round(flockSize * infectionRate);
    const deaths = Math.round(infected * mortalityFromDisease); const survivorsTreated = infected - deaths;
    const treatmentCostTotal = infected * treatmentPerHead; const mortalityLossValue = deaths * avgAnimalValue;
    const weightLossValueTotal = survivorsTreated * avgAnimalValue * weightLossPercent;
    const totalEconomicLoss = treatmentCostTotal + mortalityLossValue + weightLossValueTotal;
    const diseaseSelectEl = document.getElementById('opDiseaseTypeSelect');
    const diseaseName = diseaseSelectEl ? diseaseSelectEl.selectedOptions[0].text : "مرض ما";
    const resultsEl = document.getElementById('diseaseOutbreakResultsDisplay');
    if (resultsEl) {
        resultsEl.innerHTML = `<div class="alert-info" style="border-color:#e74c3c; background-color:#fbe9e7; color:#c0392b;"><h5 style="margin-top:0; color:#c0392b;">تقدير تأثير (${diseaseName}):</h5><p>مصاب: ${infected} | نفوق: ${deaths}</p><p>علاج: ${formatCurrency(treatmentCostTotal)} | خسائر نفوق: ${formatCurrency(mortalityLossValue)}</p><p>فقدان وزن: ${formatCurrency(weightLossValueTotal)}</p><strong style="display:block; margin-top:10px; padding-top:10px; border-top:1px solid #e74c3c;">إجمالي الخسائر الاقتصادية: ${formatCurrency(totalEconomicLoss)}</strong></div>`;
        resultsEl.style.display = 'block';
    }
}

function optimizeLaborScheduling() {
    const i = currentProjectData.inputs; if(!i || Object.keys(i).length === 0) {showAppNotification("يرجى ملء البيانات الأساسية أولاً.", "warn"); return;}
    const workers = getVal('opCurrentWorkers'); const hoursPerDay = getVal('opWorkHoursPerDay'); const daysPerWeek = getVal('opWorkDaysPerWeek');
    const sheepPerWorkerRatio = getVal('opSheepPerWorkerRatio'); const flockSize = i.initialEwes + i.initialRams + i.improvedRamsCountUsed;
    const overtimeHoursWeekly = getVal('opOvertimeHoursPerWeek'); const overtimePayIncrease = getVal('opOvertimePayRatePercent') / 100;
    const baseSalary = i.workerMonthlySalary;
    const neededWorkers = sheepPerWorkerRatio > 0 ? Math.ceil(flockSize / sheepPerWorkerRatio) : workers;
    const actualRatio = workers > 0 && flockSize > 0 ? (flockSize / workers) : 0;
    const regularWeeklyHoursPerWorker = hoursPerDay * daysPerWeek; 
    const hourlyRate = baseSalary > 0 && regularWeeklyHoursPerWorker > 0 ? baseSalary / (regularWeeklyHoursPerWorker * 4.33) : 0;
    const overtimePayPerWorkerWeekly = overtimeHoursWeekly * hourlyRate * (1 + overtimePayIncrease);
    const totalMonthlyLaborCost = workers * (baseSalary + (overtimePayPerWorkerWeekly * 4.33));
    let assessment = "";
    if (workers < neededWorkers) assessment = `<p style="color: #e74c3c;">نقص (${neededWorkers - workers}) عامل.</p>`;
    else if (workers > neededWorkers + 1 && neededWorkers > 0) assessment = `<p style="color: #f39c12;">فائض محتمل (${workers - neededWorkers}) عامل.</p>`;
    else assessment = `<p style="color: #27ae60;">عدد العمال يبدو مناسبًا.</p>`;
    setContent('laborScheduleResultsDisplay', `<div class="alert-info" style="background-color:#e6f7ff; border-color:#91d5ff; color:#0050b3;"><h5 style="margin-top:0; color:#0050b3;">تحليل العمالة:</h5><p>مطلوب (بناءً على ${sheepPerWorkerRatio} رأس/عامل): ${neededWorkers} | الحالي: ${workers}</p>${assessment}<p>المعدل الفعلي: ${actualRatio.toFixed(1)} رأس/عامل.</p><p>تكلفة العمالة الشهرية المقدرة (مع الإضافي): ${formatCurrency(totalMonthlyLaborCost)}</p></div>`);
}

function createOperationalKPIChart() {
    destroyChart('operationalKPI');
    const kpiCtx = document.getElementById('operationalKPIChart')?.getContext('2d');
    if (!kpiCtx || !currentProjectData.inputs) { if(kpiCtx) kpiCtx.clearRect(0,0,kpiCtx.canvas.width, kpiCtx.canvas.height); return;}
    const i = currentProjectData.inputs; const flockSize = i.initialEwes + i.initialRams + i.improvedRamsCountUsed; const workers = getVal('opCurrentWorkers');
    const targetSheepPerWorker = getVal('opSheepPerWorkerRatio') || 25;
    const laborEfficiency = flockSize > 0 && workers > 0 && targetSheepPerWorker > 0 ? Math.min(100, ( (flockSize / workers) / targetSheepPerWorker ) * 100 ) : 50;
    const healthKPI = 100 - (i.overallMortalityRate);
    const targetFCR = 4.5; const feedEfficiencyKPI = i.feedConversionRatio > 0 ? Math.max(0, Math.min(100, (targetFCR / i.feedConversionRatio) * 100 ) ) : 50;
    const targetLambsPerEweYear = 1.8; const breedingProductivityKPI = Math.min(100, ( (i.birthsPerEwePerYear * i.avgOffspringPerBirth * (i.fertilityRatePercent/100) ) / targetLambsPerEweYear) * 100 ) ;
    appCharts.operationalKPI = new Chart(kpiCtx, { type: 'radar', data: { labels: ['كفاءة العمالة', 'صحة القطيع', 'كفاءة التغذية', 'إنتاجية التناسل'], datasets: [{ label: 'مؤشرات الأداء (%)', data: [laborEfficiency, healthKPI, feedEfficiencyKPI, breedingProductivityKPI].map(v => v.toFixed(0)), backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgb(75, 192, 192)', pointBackgroundColor: 'rgb(75, 192, 192)' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, suggestedMax: 100, suggestedMin:0, ticks:{stepSize:20, backdropColor: 'rgba(255,255,255,0.7)'} }}, plugins:{legend:{labels:{font:{size:10}}}, title:{display:true, text:'مؤشرات الأداء التشغيلي الرئيسية (KPIs)'}} } });
}

function saveProjectData() {
    const projectState = {};
    Object.keys(currentProjectData.inputs).forEach(id => { const el = document.getElementById(id); if (el) { projectState[id] = el.type === 'checkbox' ? el.checked : el.value; } else { projectState[id] = currentProjectData.inputs[id]; } });
    projectState['_calculationsSnapshot'] = currentProjectData.calculations; projectState['_multiYearProjections'] = currentProjectData.multiYearProjections;
    projectState['_feedMixData'] = currentProjectData.currentFeedMixData; projectState['_breedingEvents'] = currentProjectData.breedingEventsData;
    projectState['_sensitivityData'] = currentProjectData.sensitivityAnalysisData;
    const dataStr = JSON.stringify(projectState, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url;
    const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
    link.download = `بيانات_مشروع_اغنام_${timestamp}.json`; link.click(); URL.revokeObjectURL(link.href);
    showAppNotification("تم حفظ بيانات المشروع!", "success"); hideBottomSheet('menu');
}

function loadProjectData(event) {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedState = JSON.parse(e.target.result);
            Object.keys(loadedState).forEach(id => {
                if (id.startsWith('_')) {
                    if(id === '_calculationsSnapshot') currentProjectData.calculations = loadedState[id]; else if(id === '_multiYearProjections') currentProjectData.multiYearProjections = loadedState[id];
                    else if(id === '_feedMixData') currentProjectData.currentFeedMixData = loadedState[id]; else if(id === '_breedingEvents') currentProjectData.breedingEventsData = loadedState[id];
                    else if(id === '_sensitivityData') currentProjectData.sensitivityAnalysisData = loadedState[id];
                } else { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = loadedState[id]; else el.value = loadedState[id]; } else { currentProjectData.inputs[id] = loadedState[id]; } }
            });
            calculateAllFinancials(); showAppNotification("تم تحميل البيانات!", "success");
            handleSectionSpecificLogic('multiyear', true); handleSectionSpecificLogic('feedOptimizer', true);
            handleSectionSpecificLogic('breedingCalendar', true); handleSectionSpecificLogic('sensitivity', true);
        } catch (err) { console.error("Error loading project data:", err); showAppNotification("فشل تحميل الملف.", "error"); }
    };
    reader.readAsText(file, "UTF-8"); event.target.value = null; hideBottomSheet('menu');
}

function generateAndShowDetailedReport() {
    const calc = currentProjectData.calculations; const inputs = currentProjectData.inputs; if (!calc || !inputs) { showAppNotification("يرجى إجراء الحسابات أولاً.", "warn"); return; }
    let reportHTML = `<div style="padding:10px;"> <h4 style="color:#667eea; border-bottom:1px solid #eee; padding-bottom:5px;">الملخص المالي:</h4> <table id="detailedReportTable"> <tr><td>إجمالي الاستثمار:</td><td>${formatCurrency(calc.finalTotalInvestment)}</td></tr> <tr><td>الإيرادات السنوية:</td><td>${formatCurrency(calc.totalAnnualRevenue)}</td></tr> <tr><td>التكاليف التشغيلية السنوية:</td><td>${formatCurrency(calc.totalAnnualOperatingCosts)}</td></tr> <tr><td>الربح الصافي السنوي:</td><td>${formatCurrency(calc.netAnnualProfit)}</td></tr> <tr><td>العائد على الاستثمار (ROI):</td><td>${(calc.roi || 0).toFixed(1)}%</td></tr> <tr><td>فترة الاسترداد:</td><td>${calc.paybackPeriodMonths !== "N/A" ? calc.paybackPeriodMonths + ' شهر' : 'غير محدد'}</td></tr> </table>`;
    reportHTML += `<h4 style="color:#667eea; border-bottom:1px solid #eee; padding-bottom:5px; margin-top:15px;">توزيع الاستثمار:</h4> <table id="detailedReportTable"> <tr><td>شراء القطيع:</td><td>${formatCurrency(calc.flockPurchaseCost)}</td></tr> <tr><td>أصول ثابتة:</td><td>${formatCurrency(calc.totalFixedAssets)}</td></tr> <tr><td>رأس المال العامل:</td><td>${formatCurrency(calc.recommendedWorkingCapital)}</td></tr><tr><td>إهلاك سنوي للأصول:</td><td>${formatCurrency(calc.annualDepreciation)}</td></tr></table>`;
    reportHTML += `<h4 style="color:#667eea; border-bottom:1px solid #eee; padding-bottom:5px; margin-top:15px;">تفاصيل الإيرادات:</h4> <table id="detailedReportTable"> <tr><td>الأضاحي:</td><td>${formatCurrency(calc.udheyaRevenue)}</td></tr> <tr><td>اللحوم:</td><td>${formatCurrency(calc.meatRevenue)}</td></tr> <tr><td>حيوانات حية:</td><td>${formatCurrency(calc.liveAnimalRevenue)}</td></tr> <tr><td>كاترينج:</td><td>${formatCurrency(calc.cateringRevenue)}</td></tr> <tr><td>تأجير:</td><td>${formatCurrency(calc.eventRentalRevenue)}</td></tr> <tr><td>تصدير:</td><td>${formatCurrency(calc.exportRevenue)}</td></tr> <tr><td>منتجات ثانوية:</td><td>${formatCurrency(calc.byproductsRevenue)}</td></tr> </table>`;
    const proj = currentProjectData.multiYearProjections;
    if (proj && proj.years && proj.years.length > 0) {
        reportHTML += `<h4 style="color:#667eea; border-bottom:1px solid #eee; padding-bottom:5px; margin-top:15px;">التوقعات لـ 5 سنوات:</h4> <div style="overflow-x:auto;"><table id="detailedReportTable" style="min-width:500px;"><thead><tr><th>البيان</th>`;
        proj.years.forEach(year => reportHTML += `<th>${year.replace('السنة ','س')}</th>`);
        reportHTML += `</tr></thead><tbody> <tr><td>القطيع</td>${proj.flock.map(v => `<td>${formatCurrency(v,false,true)}</td>`).join('')}</tr> <tr><td>الإيرادات</td>${proj.revenue.map(v => `<td>${formatCurrency(v,true,true)}</td>`).join('')}</tr>  <tr><td>التشغيلية</td>${proj.opCosts.map(v => `<td>${formatCurrency(v,true,true)}</td>`).join('')}</tr> <tr><td>استثمار إضافي</td>${proj.investment.map(v => `<td>${formatCurrency(v,true,true)}</td>`).join('')}</tr> <tr><td>الربح الصافي</td>${proj.netProfit.map(v => `<td>${formatCurrency(v,true,true)}</td>`).join('')}</tr> </tbody></table></div>`;
    }
    const sensitivityData = currentProjectData.sensitivityAnalysisData;
    if(sensitivityData && sensitivityData.monteCarlo && sensitivityData.monteCarlo.length > 0) {
        const baseProfitForReport = calc.netAnnualProfit; const mcResultsForReport = sensitivityData.monteCarlo;
        const profitableRuns = mcResultsForReport.filter(r => r > 0).length; const profitabilityPercent = (profitableRuns / mcResultsForReport.length * 100);
        const meanProfit = mcResultsForReport.reduce((sum, r) => sum + r, 0) / mcResultsForReport.length;
        const sortedMC = [...mcResultsForReport].sort((a,b) => a - b); const p5 = sortedMC[Math.floor(sortedMC.length * 0.05)]; const p95 = sortedMC[Math.floor(sortedMC.length * 0.95)];
        reportHTML += `<h4 style="color:#667eea; border-bottom:1px solid #eee; padding-bottom:5px; margin-top:15px;">ملخص تقييم المخاطر:</h4> <table id="detailedReportTable"> <tr><td>احتمالية الربح:</td><td>${profitabilityPercent.toFixed(1)}%</td></tr> <tr><td>متوسط الربح (مونت كارلو):</td><td>${formatCurrency(meanProfit)}</td></tr> <tr><td>نطاق الربح (90%):</td><td>من ${formatCurrency(p5)} إلى ${formatCurrency(p95)}</td></tr> </table>`;
    }
    reportHTML += `<h4 style="color:#667eea; border-bottom:1px solid #eee; padding-bottom:5px; margin-top:15px;">الافتراضات الرئيسية:</h4><ul style="font-size:0.9em; padding-right:20px; list-style-type: disc;"><li>نسبة العائد على اللحم (Yield): ${inputs.meatYieldPercentInput}%</li><li>نسبة الذكور الموجهة للأضاحي: ${inputs.percentMalesForUdheyaInput}%</li><li>عمر الأصول القابلة للإهلاك: ${inputs.fixedAssetsLifespanYears} سنوات (طريقة القسط الثابت)</li><li>الزكاة حسبت على أساس سعر النعاج للعدد المستحق.</li><li>التوزيع الموسمي للإيرادات تقديري.</li></ul>`;
    reportHTML += `</div>`; setContent('detailedReportContentContainer', reportHTML);
    showBottomSheet('detailedReport'); if(document.getElementById('menuSheet').classList.contains('active')) hideBottomSheet('menu');
}

async function exportReportToPDF() {
    const calc = currentProjectData.calculations; if (!calc) { showAppNotification("يرجى إجراء الحسابات أولاً.", "warn"); return; }
    if (typeof jsPDF === 'undefined' || typeof jsPDF.API.autoTable === 'undefined') { showAppNotification('مكتبات PDF غير جاهزة.', 'error'); return; }
    const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica'); doc.setR2L(true); const pageWidth = doc.internal.pageSize.getWidth(); const margin = 15; let yPos = 20;
    doc.setFontSize(18); doc.text('تقرير جدوى مشروع تربية الأغنام', pageWidth / 2, yPos, { align: 'center' }); yPos += 10;
    doc.setFontSize(10); doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - margin, yPos, { align: 'right'}); yPos += 10;
    const autoTableStyles = { font: 'helvetica', halign: 'right', cellPadding: 2, fontSize: 9, minCellHeight: 7, fontStyle:'normal' };
    const autoTableHeadStyles = { fillColor: [60, 80, 150], textColor: 255, halign: 'center', fontStyle: 'bold' };
    const addSectionToPdf = (title, dataArray, head = [['البيان', 'القيمة']]) => {
        const tableHeightEstimate = dataArray.length * 8 + 10;
        if (yPos + tableHeightEstimate > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14); doc.text(title, pageWidth - margin , yPos, {align: 'right'}); yPos += 6;
        doc.autoTable({ startY: yPos, head: head, body: dataArray, theme: 'grid', styles: autoTableStyles, headStyles: autoTableHeadStyles, columnStyles: { 0: { halign: 'right', cellWidth: pageWidth/2.5 }, 1: { halign: 'left', cellWidth: 'auto'} }, margin: { right: margin, left: margin } });
        yPos = doc.autoTable.previous.finalY + 8;
    };
    addSectionToPdf('الملخص المالي الرئيسي', [ ['إجمالي الاستثمار', `${formatCurrency(calc.finalTotalInvestment,false,true)} ج.م`], ['الإيرادات السنوية', `${formatCurrency(calc.totalAnnualRevenue,false,true)} ج.م`], ['التكاليف التشغيلية', `${formatCurrency(calc.totalAnnualOperatingCosts,false,true)} ج.م`], ['الربح الصافي', `${formatCurrency(calc.netAnnualProfit,false,true)} ج.م`], ['ROI', `${(calc.roi || 0).toFixed(1)}%`], ['فترة الاسترداد', `${calc.paybackPeriodMonths !== "N/A" ? calc.paybackPeriodMonths : 'غير محدد'} شهر`] ]);
    addSectionToPdf('توزيع الاستثمار', [ ['شراء القطيع', `${formatCurrency(calc.flockPurchaseCost, false, true)} ج.م`], ['إجمالي الأصول الثابتة', `${formatCurrency(calc.totalFixedAssets, false, true)} ج.م`], ['رأس المال العامل', `${formatCurrency(calc.recommendedWorkingCapital, false, true)} ج.م`], ['إهلاك سنوي للأصول', `${formatCurrency(calc.annualDepreciation, false, true)} ج.م`]]);
    const proj = currentProjectData.multiYearProjections;
    if (proj && proj.years.length > 0) {
        if (yPos > doc.internal.pageSize.getHeight() - 70) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14); doc.text('التوقعات لـ 5 سنوات', pageWidth - margin, yPos, {align: 'right'}); yPos += 6;
        const multiYearHead = [['البيان', ...proj.years.map(y => y.replace('السنة ','س'))]];
        const multiYearBody = [ ['القطيع', ...proj.flock.map(v => formatCurrency(v,false,true))], ['الإيرادات', ...proj.revenue.map(v => formatCurrency(v,true,true).replace(' ألف','').replace(' مليون',''))], ['الربح الصافي', ...proj.netProfit.map(v => formatCurrency(v,true,true).replace(' ألف','').replace(' مليون',''))] ];
        doc.autoTable({ startY: yPos, head: multiYearHead, body: multiYearBody, theme: 'striped', styles: {font: 'helvetica', fontSize: 8, cellPadding: 1.5, halign: 'center', fontStyle:'normal' }, headStyles:{fillColor:[60,80,150], textColor:255, fontStyle:'bold'}, margin:{right:margin, left:margin}});
        yPos = doc.autoTable.previous.finalY + 8;
    }
    doc.save(`تقرير_مشروع_اغنام_${new Date().toISOString().slice(0,10)}.pdf`);
    showAppNotification("تم تصدير تقرير PDF!", "success"); hideBottomSheet('menu');
}

function exportDataToExcel() {
    const calc = currentProjectData.calculations; if (!calc) { showAppNotification("يرجى إجراء الحسابات أولاً.", "warn"); return; }
    let csvContent = "\uFEFF"; csvContent += "البيان,القيمة\n";
    const data = { "إجمالي الاستثمار المطلوب": calc.finalTotalInvestment, "الإيرادات السنوية المتوقعة": calc.totalAnnualRevenue, "التكاليف التشغيلية السنوية": calc.totalAnnualOperatingCosts, "الربح السنوي الصافي": calc.netAnnualProfit, "العائد على الاستثمار (ROI)": `${(calc.roi || 0).toFixed(1)}%`, "فترة استرداد رأس المال (شهور)": calc.paybackPeriodMonths };
    Object.entries(data).forEach(([key, value]) => { csvContent += `"${key}","${value}"\n`; });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ملخص_مشروع_اغنام_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showAppNotification("تم تصدير Excel (CSV)!", "success"); hideBottomSheet('menu');
}

function printDetailedReportView() {
    const reportSheet = document.getElementById('detailedReportSheet');
    const reportContentEl = document.getElementById('detailedReportContentContainer');
    const appContainer = document.getElementById('app-container');

    if (reportSheet && reportSheet.classList.contains('active') && reportContentEl && appContainer) {
        const originalBodyPadding = document.body.style.padding; document.body.style.padding = "0";
        const elementsToHide = ['.app-header', '.bottom-nav', '.fab', '#menuSheet', '#moreSheet', '#pageOverlay', '#detailedReportSheet .sheet-header', '#detailedReportSheet > div:last-child button'];
        elementsToHide.forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
        
        reportSheet.classList.add('printing-active'); 
        reportContentEl.style.padding = "10mm"; 
        reportContentEl.style.margin = "0 auto"; 
        reportContentEl.style.maxWidth="190mm"; 
        
        appContainer.style.height = 'auto'; 
        document.body.classList.add('printing');
        
        window.print();
        
        setTimeout(() => {
            document.body.style.padding = originalBodyPadding;
            elementsToHide.forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = ''));
            reportSheet.classList.remove('printing-active');
            appContainer.style.height = '100vh'; 
            document.body.classList.remove('printing');
        }, 500);

    } else { generateAndShowDetailedReport(); setTimeout(printDetailedReportView, 700); }
}
