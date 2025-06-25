let currentSfmSectionId = 'dashboard';
let sfmTouchStartXCoord = 0;
let sfmTouchEndXCoord = 0;
let sfmTouchStartYCoord = 0;
let sfmTouchEndYCoord = 0;
let sfmIsPullingToRefresh = false;
let sfmAppCharts = {};
let sfmIsInitialAppLoad = true;
let sfmIsLoading = false;

const sfmAppSectionOrder = ['dashboard', 'animalManagement', 'breedingManagement', 'healthManagement', 'feedingManagement', 'inventoryManagement', 'taskManagement', 'salesPurchases', 'reports', 'settings'];

let sfmData = {
    animals: [],
    matings: [],
    lambings: [],
    weanings: [],
    healthRecords: [],
    feedRations: [],
    feedConsumptionLog: [],
    waterLog: [],
    inventory: [],
    tasks: [],
    transactions: [],
    settings: {
        farmName: "مزرعتي النموذجية",
        farmOwner: "اسم المالك",
        defaultCurrency: "ج.م",
        customBreeds: ["بلدي", "رحماني", "عسافي", "برقي", "ماعز شامي"],
        customFeedTypes: ["علف تسمين", "علف حلاب", "علف مركز", "ذرة مجروشة", "شعير", "نخالة", "دريس حجازي", "تبن قمح"],
        defaultAnimalStatus: "active",
        defaultTaskPriority: "medium",
        defaultTaskStatus: "pending"
    }
};

function getVal(id, isCheckbox = false, isSelect = false) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`getVal: Element with ID '${id}' not found.`); return isCheckbox ? false : (isSelect ? '' : 0); }
    if (isCheckbox) return el.checked;
    if (isSelect) return el.value;
    const value = parseFloat(el.value);
    if (el.hasAttribute('min') && parseFloat(el.getAttribute('min')) >= 0 && value < 0) return 0;
    return isNaN(value) ? 0 : value;
}
function getStrVal(id) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`getStrVal: Element with ID '${id}' not found.`); return ''; }
    return el.value.trim();
}
function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) ? '' : value;
}
function setContent(id, content) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (content === null || content === undefined) ? '' : content;
}
function sfmFormatCurrency(num) {
    if (isNaN(parseFloat(num)) || num === null || num === undefined) return '0';
    return new Intl.NumberFormat('ar-EG').format(Math.round(num)) + ' ' + (sfmData.settings.defaultCurrency || 'ج.م');
}
function sfmFormatDate(dateStrOrDate, type = 'short') {
    if (!dateStrOrDate) return 'غير محدد';
    try {
        const options = type === 'long' ? { year: 'numeric', month: 'long', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStrOrDate).toLocaleDateString('ar-EG', options);
    } catch (e) { return 'تاريخ غير صالح'; }
}
function generateUUID() { return crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }

function showSfmAppNotification(message, type = 'success') {
    const existingNotif = document.querySelector('.app-notification');
    if (existingNotif) existingNotif.remove();
    const notif = document.createElement('div');
    notif.className = 'app-notification'; notif.textContent = message;
    notif.style.cssText = `position: fixed; top: calc(env(safe-area-inset-top) + 60px + 10px); left: 50%; transform: translateX(-50%) translateY(-40px); background: ${type === 'success' ? '#4CAF50' : (type === 'warn' ? '#FFC107' : '#F44336')}; color: white; padding: 10px 20px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px; font-weight: 500; z-index: 2000; opacity: 0; transition: opacity 0.25s ease-out, transform 0.25s ease-out; text-align: center; max-width: 90%;`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; notif.style.transform = 'translateX(-50%) translateY(0px)'; }, 10);
    setTimeout(() => { notif.style.opacity = '0'; notif.style.transform = 'translateX(-50%) translateY(-40px)'; setTimeout(() => notif.remove(), 300); }, type === 'error' ? 4000 : 2500);
}

function toggleSfmLoading(show) {
    sfmIsLoading = show;
    const fab = document.getElementById('sfmMainFab');
    if (fab) {
        if (show) { fab.innerHTML = '<div class="fab-spinner"></div>'; fab.disabled = true; }
        else { fab.innerHTML = '<span>➕</span>'; fab.disabled = false; }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSfmAppControls();
    setupSfmGlobalEventListeners();
    loadSfmDataFromLocalStorage();
    refreshAllSfmDataViews(); // Initial render of all lists and dashboard
    loadFarmSettingsToUI();

    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => { if (!input.value) { input.valueAsDate = new Date(); } });
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif";
        Chart.defaults.font.size = 11; Chart.defaults.color = '#606770';
        Chart.defaults.plugins.legend.position = 'bottom'; Chart.defaults.plugins.tooltip.rtl = true;
        Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' }; Chart.defaults.plugins.title.display = true;
        Chart.defaults.plugins.title.color = '#050505'; Chart.defaults.plugins.title.font = { weight: '600', size: 14};
    } else { console.error("Chart.js is not loaded!"); }
});

function initializeSfmAppControls() {
    updateSfmActiveNavigation();
    document.querySelectorAll('#sfmsBottomNav .nav-item, #sfmsMenuSheet .btn, #sfmsMoreSheet .nav-item, .header-btn, .fab').forEach(element => {
        element.addEventListener('click', function() { this.classList.add('haptic-feedback'); setTimeout(() => this.classList.remove('haptic-feedback'), 150); });
    });
}
function setupSfmGlobalEventListeners() {
    const contentAreaEl = document.getElementById('sfmsContentArea');
    if (!contentAreaEl) return;
    contentAreaEl.addEventListener('touchstart', handleSfmPageTouchStart, { passive: false });
    contentAreaEl.addEventListener('touchmove', handleSfmPageTouchMove, { passive: false });
    contentAreaEl.addEventListener('touchend', handleSfmPageTouchEnd);
}

function handleSfmPageTouchStart(e) {
    if (e.target.closest('.sheet-content') || e.target.closest('.chart-container canvas') || e.target.closest('.modal-content-sfms')) { sfmTouchStartXCoord = 0; return; }
    sfmTouchStartXCoord = e.touches[0].clientX; sfmTouchStartYCoord = e.touches[0].clientY;
    sfmTouchEndXCoord = e.touches[0].clientX; sfmTouchEndYCoord = e.touches[0].clientY;
}
function handleSfmPageTouchMove(e) {
    if (!sfmTouchStartXCoord && !sfmTouchStartYCoord) return;
    sfmTouchEndXCoord = e.touches[0].clientX; sfmTouchEndYCoord = e.touches[0].clientY;
    const diffX = sfmTouchStartXCoord - sfmTouchEndXCoord; const diffY = sfmTouchStartYCoord - sfmTouchEndYCoord;
    const swipeLeftIndicator = document.getElementById('navSwipeLeft'); const swipeRightIndicator = document.getElementById('navSwipeRight');
    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 20) {
        if (e.cancelable) e.preventDefault();
        if (diffX > 0) { if(swipeRightIndicator) swipeRightIndicator.classList.add('active'); if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); }
        else { if(swipeLeftIndicator) swipeLeftIndicator.classList.add('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); }
    } else { if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); }
    const contentAreaEl = document.getElementById('sfmsContentArea'); const pullToRefreshEl = document.getElementById('pagePullToRefresh');
    if (contentAreaEl && pullToRefreshEl && contentAreaEl.scrollTop <= 5 && diffY < -60 && Math.abs(diffX) < Math.abs(diffY)) { if (e.cancelable) e.preventDefault(); sfmIsPullingToRefresh = true; pullToRefreshEl.classList.add('visible'); }
}
function handleSfmPageTouchEnd() {
    const swipeLeftIndicator = document.getElementById('navSwipeLeft'); const swipeRightIndicator = document.getElementById('navSwipeRight');
    if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active');
    if (!sfmTouchStartXCoord && !sfmTouchStartYCoord) return;
    const diffX = sfmTouchStartXCoord - sfmTouchEndXCoord; const diffY = sfmTouchStartYCoord - sfmTouchEndYCoord;
    const absDiffX = Math.abs(diffX); const absDiffY = Math.abs(diffY);
    if (absDiffX > 60 && absDiffX > absDiffY * 1.2) {
        const currentIndex = sfmAppSectionOrder.indexOf(currentSfmSectionId);
        if (diffX > 0 && currentIndex < sfmAppSectionOrder.length - 1) navigateToSfmSection(sfmAppSectionOrder[currentIndex + 1], 'left');
        else if (diffX < 0 && currentIndex > 0) navigateToSfmSection(sfmAppSectionOrder[currentIndex - 1], 'right');
    }
    const pullToRefreshEl = document.getElementById('pagePullToRefresh'); const contentAreaEl = document.getElementById('sfmsContentArea');
    if (pullToRefreshEl && sfmIsPullingToRefresh && absDiffY > 70 && absDiffY > absDiffX && contentAreaEl && contentAreaEl.scrollTop <= 5 ) {
        pullToRefreshEl.classList.add('refreshing'); showSfmAppNotification("جاري تحديث البيانات...", "info");
        setTimeout(() => { refreshAllSfmDataViews(); pullToRefreshEl.classList.remove('visible', 'refreshing'); sfmIsPullingToRefresh = false; }, 800);
    } else if (pullToRefreshEl) { pullToRefreshEl.classList.remove('visible'); sfmIsPullingToRefresh = false; }
    sfmTouchStartXCoord = 0; sfmTouchEndXCoord = 0; sfmTouchStartYCoord = 0; sfmTouchEndYCoord = 0;
}

function navigateToSfmSection(sectionId, direction = null) {
    const oldSection = document.querySelector('#sfmsContentArea .section-page.active');
    const newSection = document.getElementById(sectionId);
    if (!newSection) { console.error("SFM Target section not found:", sectionId); return; }
    if (oldSection && oldSection.id === sectionId && !sfmIsInitialAppLoad) return;
    document.querySelectorAll('#sfmsContentArea .section-page').forEach(s => s.classList.remove('active', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right'));
    newSection.style.transform = '';
    if (oldSection && oldSection.id !== sectionId) {
        oldSection.classList.remove('active');
        if (direction === 'left') { oldSection.classList.add('slide-out-left'); newSection.style.transform = 'translateX(100%)'; }
        else if (direction === 'right') { oldSection.classList.add('slide-out-right'); newSection.style.transform = 'translateX(-100%)'; }
    }
    newSection.classList.add('active');
    if (direction) { void newSection.offsetWidth; if (direction === 'left') newSection.classList.add('slide-in-right'); else if (direction === 'right') newSection.classList.add('slide-in-left'); }
    else { newSection.style.transform = 'translateX(0)'; }
    setTimeout(() => { if(oldSection) oldSection.classList.remove('slide-out-left', 'slide-out-right'); newSection.classList.remove('slide-in-left', 'slide-in-right'); if (direction) newSection.style.transform = ''; }, 350);
    currentSfmSectionId = sectionId; updateSfmActiveNavigation();
    const contentArea = document.getElementById('sfmsContentArea'); if(contentArea) contentArea.scrollTop = 0;
    refreshCurrentSectionData(); sfmIsInitialAppLoad = false;
}

function showSfmSection(sectionId, direction = null) {
    const oldSectionEl = document.querySelector('#sfmsContentArea .section-page.active');
    if (oldSectionEl && oldSectionEl.id === sectionId && !direction && !sfmIsInitialAppLoad) return;
    navigateToSfmSection(sectionId, direction);
}

function updateSfmActiveNavigation() {
    document.querySelectorAll('#sfmsBottomNav .nav-item').forEach(item => item.classList.remove('active'));
    const mainSectionsForNav = ['dashboard', 'animalManagement', 'breedingManagement', 'healthManagement'];
    const activeNavIndex = mainSectionsForNav.indexOf(currentSfmSectionId);
    const moreNavBtn = document.getElementById('sfmsMoreNavBtn');
    if (activeNavIndex !== -1) { document.querySelectorAll('#sfmsBottomNav .nav-item')[activeNavIndex].classList.add('active'); if(moreNavBtn) moreNavBtn.classList.remove('active'); }
    else { if(moreNavBtn) moreNavBtn.classList.add('active'); }
}

function showSfmBottomSheet(type) {
    const sheetId = type === 'sfmsMenuSheet' ? 'sfmsMenuSheet' : 'sfmsMoreSheet';
    const sheetEl = document.getElementById(sheetId); const overlayEl = document.getElementById('sfmsPageOverlay');
    if (sheetEl && overlayEl) { sheetEl.classList.add('active'); overlayEl.classList.add('active'); }
}
function hideSfmBottomSheet(type) {
    const sheetId = type === 'sfmsMenuSheet' ? 'sfmsMenuSheet' : 'sfmsMoreSheet';
    const sheetEl = document.getElementById(sheetId); if (sheetEl) sheetEl.classList.remove('active');
    const anySheetActive = Array.from(document.querySelectorAll('.bottom-sheet')).some(s => s.classList.contains('active'));
    if (!anySheetActive) { const overlayEl = document.getElementById('sfmsPageOverlay'); if(overlayEl) overlayEl.classList.remove('active'); }
}
function hideAllSfmSheets() {
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('active'));
    const overlayEl = document.getElementById('sfmsPageOverlay'); if(overlayEl) overlayEl.classList.remove('active');
    closeSfmFormModal();
}

function refreshCurrentSectionData() {
    switch (currentSfmSectionId) {
        case 'dashboard': renderDashboard(); break;
        case 'animalManagement': renderAnimalList(); break;
        case 'breedingManagement': renderMatingRecords(); renderLambingRecords(); renderWeaningRecords(); break;
        case 'healthManagement': renderHealthRecords(); break;
        case 'feedingManagement': populateFeedRationSelect(); displaySelectedRation(); renderWaterLog(); break;
        case 'inventoryManagement': renderInventoryList(); break;
        case 'taskManagement': renderTaskList(); break;
        case 'salesPurchases': renderTransactionList(); break;
        case 'reports': setSfmContent('reportOutputArea', '<p class="list-empty-message" style="padding:20px;">اختر تقريراً لعرضه.</p>'); break;
        case 'settings': loadFarmSettingsToUI(); break;
    }
}
function refreshAllSfmDataViews(){
    renderDashboard(); renderAnimalList(); renderMatingRecords(); renderLambingRecords(); renderWeaningRecords(); renderHealthRecords();
    populateFeedRationSelect(); displaySelectedRation(); renderWaterLog(); renderInventoryList(); renderTaskList(); renderTransactionList();
    loadFarmSettingsToUI();
}

const SFM_DATA_KEY = 'sheepFarmManagementSystemData';
function saveSfmDataToLocalStorage() { try { localStorage.setItem(SFM_DATA_KEY, JSON.stringify(sfmData)); } catch(e) { console.error("Error saving to localStorage:", e); showSfmAppNotification("خطأ: لم يتم حفظ البيانات.", "error"); } }
function loadSfmDataFromLocalStorage() {
    const dataStr = localStorage.getItem(SFM_DATA_KEY);
    if (dataStr) { try { const loaded = JSON.parse(dataStr); sfmData = {...createDefaultSfmData(), ...loaded, settings: {...createDefaultSfmData().settings, ...(loaded.settings || {})}}; } catch(e) { console.error("Error parsing data from localStorage:", e); sfmData = createDefaultSfmData(); } }
    else { sfmData = createDefaultSfmData(); }
    sfmData.animals = sfmData.animals || []; sfmData.matings = sfmData.matings || []; sfmData.lambings = sfmData.lambings || [];
    sfmData.weanings = sfmData.weanings || []; sfmData.healthRecords = sfmData.healthRecords || [];
    sfmData.feedRations = sfmData.feedRations || []; sfmData.feedConsumptionLog = sfmData.feedConsumptionLog || [];
    sfmData.waterLog = sfmData.waterLog || []; sfmData.inventory = sfmData.inventory || []; sfmData.tasks = sfmData.tasks || []; sfmData.transactions = sfmData.transactions || [];
    sfmData.settings.customBreeds = sfmData.settings.customBreeds && sfmData.settings.customBreeds.length > 0 ? sfmData.settings.customBreeds : ["بلدي", "رحماني", "عسافي"];
    sfmData.settings.customFeedTypes = sfmData.settings.customFeedTypes && sfmData.settings.customFeedTypes.length > 0 ? sfmData.settings.customFeedTypes : ["علف تسمين", "ذرة"];
}
function createDefaultSfmData(){
    return { animals: [], matings: [], lambings: [], weanings: [], healthRecords: [], feedRations: [], feedConsumptionLog:[], waterLog:[], inventory: [], tasks: [], transactions: [], settings: { farmName: "مزرعتي النموذجية", farmOwner: "اسم المالك", defaultCurrency: "ج.م", customBreeds: ["بلدي", "رحماني", "عسافي", "برقي"], customFeedTypes: ["علف تسمين", "علف حلاب", "ذرة مجروشة", "شعير", "نخالة", "دريس حجازي"]}};
}

function openSfmFormModal(title, formHTML, onSubmitCallbackName, entityId = null, modalSize = 'medium') {
    setSfmContent('formModalTitle', title);
    const modalBody = document.getElementById('formModalBody');
    const modalContent = document.getElementById('formModalContainer');
    if (modalBody && modalContent) {
        modalBody.innerHTML = formHTML + `<div class="modal-footer-sfms"><button class="btn btn-primary" onclick="${onSubmitCallbackName}('${entityId || ''}')">حفظ</button><button class="btn btn-secondary" onclick="closeSfmFormModal()">إلغاء</button></div>`;
        modalContent.className = 'modal-content-sfms'; // Reset size
        if(modalSize === 'large') modalContent.classList.add('modal-large');
        else if(modalSize === 'small') modalContent.classList.add('modal-small');
    }
    document.getElementById('formModalOverlay').classList.add('active');
}
function closeSfmFormModal() { document.getElementById('formModalOverlay').classList.remove('active'); setSfmContent('formModalBody', '');}

function renderDashboard() {
    const statsContainer = document.getElementById('dashboardStats');
    const tasksContainer = document.getElementById('dashboardTasks');
    const noTasksMsg = document.getElementById('noDashboardTasksMessage');
    if (!statsContainer || !tasksContainer || !noTasksMsg) return;
    const totalAnimals = sfmData.animals.length;
    const ewesCount = sfmData.animals.filter(a => a.sex === 'female' && !isLamb(a.birthDate)).length;
    const ramsCount = sfmData.animals.filter(a => a.sex === 'male' && !isLamb(a.birthDate)).length;
    const lambsCount = sfmData.animals.filter(a => isLamb(a.birthDate)).length;
    const upcomingHealth = sfmData.healthRecords.filter(hr => hr.nextDueDate && new Date(hr.nextDueDate) >= new Date() && new Date(hr.nextDueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;
    const lowFeed = sfmData.inventory.filter(item => item.type === 'feed' && item.currentStock < item.reorderLevel).length;
    const upcomingLambingCount = sfmData.matings.filter(m => m.status === 'pregnant' && m.expectedDueDate && new Date(m.expectedDueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;
    let adgTotal = 0; let adgCount = 0;
    sfmData.animals.forEach(animal => {
        if (animal.weightHistory && animal.weightHistory.length >= 2) {
            const sortedWeights = animal.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date));
            const first = sortedWeights[0];
            const last = sortedWeights[sortedWeights.length-1];
            const days = (new Date(last.date) - new Date(first.date)) / (1000*60*60*24);
            if (days > 0) { adgTotal += (last.weight - first.weight) / days; adgCount++; }
        }
    });
    const avgDailyGain = adgCount > 0 ? (adgTotal / adgCount * 1000).toFixed(0) : 0; // in grams

    statsContainer.innerHTML = `
        <div class="stat-card"><div class="stat-value">${totalAnimals}</div><div class="stat-label">إجمالي الحيوانات</div></div>
        <div class="stat-card"><div class="stat-value">${ewesCount}</div><div class="stat-label">النعاج</div></div>
        <div class="stat-card"><div class="stat-value">${ramsCount}</div><div class="stat-label">الكباش</div></div>
        <div class="stat-card"><div class="stat-value">${lambsCount}</div><div class="stat-label">الحملان</div></div>
        <div class="stat-card ${upcomingHealth > 0 ? 'alert-card' : ''}" id="dashHealthAlertsCard"><div class="stat-value" id="dashHealthAlerts">${upcomingHealth}</div><div class="stat-label">تنبيهات صحية</div></div>
        <div class="stat-card ${lowFeed > 0 ? 'alert-card' : ''}" id="dashFeedStockLowCard"><div class="stat-value" id="dashFeedStockLow">${lowFeed}</div><div class="stat-label">نقص مخزون علف</div></div>
        <div class="stat-card"><div class="stat-value" id="dashUpcomingLambings">${upcomingLambingCount}</div><div class="stat-label">ولادات قريبة</div></div>
        <div class="stat-card"><div class="stat-value" id="dashAvgDailyGain">${avgDailyGain} جم</div><div class="stat-label">متوسط прирост يومي</div></div>`;

    const upcomingTasks = sfmData.tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) >= new Date()).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);
    if (upcomingTasks.length > 0) {
        tasksContainer.innerHTML = upcomingTasks.map(task => `<li style="border-right: 4px solid ${task.priority === 'high' ? '#e74c3c' : task.priority === 'medium' ? '#f39c12' : '#27ae60'};"><span class="task-title">${task.title}</span><span class="task-due">${sfmFormatDate(task.dueDate)}</span></li>`).join('');
        noTasksMsg.style.display = 'none';
    } else { tasksContainer.innerHTML = ''; noTasksMsg.style.display = 'block'; }
    createDashboardCharts();
}
function isLamb(birthDateStr, monthsThreshold = 6) { if (!birthDateStr) return false; const birthDate = new Date(birthDateStr); const ageInMonths = (new Date().getFullYear() - birthDate.getFullYear()) * 12 + (new Date().getMonth() - birthDate.getMonth()); return ageInMonths < monthsThreshold; }

function createDashboardCharts() {
    destroyChart('dashboardPerformance'); const perfCtx = document.getElementById('dashboardPerformanceChart')?.getContext('2d');
    if (perfCtx) {
        const totalAnimals = sfmData.animals.length;
        const culledDead = sfmData.animals.filter(a => a.status === 'culled_dead').length;
        const mortalityRate = totalAnimals > 0 ? (culledDead / totalAnimals) * 100 : 0;
        const totalEwes = sfmData.animals.filter(a=>a.sex==='female' && !isLamb(a.birthDate)).length;
        const totalLambsBorn = sfmData.lambings.reduce((sum, l)=> sum + (l.lambsBorn ||0) ,0);
        const lambingRate = totalEwes > 0 ? (totalLambsBorn / totalEwes * 100) : 0; // Lambs per ewe overall
        appCharts.dashboardPerformance = new Chart(perfCtx, { type: 'bar', data: { labels: ['معدل النفوق (%)', 'معدل خصوبة النعاج (%)'], datasets: [{ label: 'أداء', data: [mortalityRate.toFixed(1), lambingRate.toFixed(1)], backgroundColor: ['#fa383e', '#5cb85c'] }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales:{x:{beginAtZero:true, suggestedMax:120}}, plugins:{title:{display:true, text:'مؤشرات أداء رئيسية'}}} });
    }
    destroyChart('dashboardBreeding'); const breedCtx = document.getElementById('dashboardBreedingChart')?.getContext('2d');
    if (breedCtx) {
        const pregnantCount = sfmData.matings.filter(m => m.status === 'pregnant').length;
        const openEwes = sfmData.animals.filter(a => a.sex === 'female' && !isLamb(a.birthDate) && !sfmData.matings.find(m => m.eweId === a.id && (m.status === 'pregnant' || m.status === 'mated'))).length;
        appCharts.dashboardBreeding = new Chart(breedCtx, { type: 'doughnut', data: { labels: ['نعاج عشار', 'نعاج فارغة (متاحة)'], datasets: [{ data: [pregnantCount, openEwes], backgroundColor: ['#4CAF50', '#FFC107'], borderColor: '#fff', borderWidth: 2}]}, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'حالة التناسل للنعاج البالغة'}} } });
    }
}

function openAnimalFormModal(animalId = null) {
    const animal = animalId ? sfmData.animals.find(a => a.id === animalId) : null;
    const title = animal ? "تعديل بيانات حيوان" : "إضافة حيوان جديد";
    const breedsOptions = [...new Set(sfmData.settings.customBreeds)].map(b => `<option value="${b}" ${animal && animal.breed === b ? 'selected' : ''}>${b}</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="animalFormTagId">الرقم التعريفي:</label><input type="text" id="animalFormTagId" value="${animal ? animal.tagId : ''}" required></div>
        <div class="input-field"><label for="animalFormName">الاسم:</label><input type="text" id="animalFormName" value="${animal ? animal.name || '' : ''}"></div>
        <div class="input-field"><label for="animalFormPhoto">صورة الحيوان:</label><input type="file" id="animalFormPhoto" accept="image/*" onchange="previewAnimalPhoto(event)"><img id="animalPhotoPreview" src="${animal && animal.photoDataUrl ? animal.photoDataUrl : '#'}" alt="Preview" style="max-width:100px; max-height:100px; margin-top:5px; display:${animal && animal.photoDataUrl ? 'block':'none'};"/></div>
        <div class="input-field"><label for="animalFormBreed">السلالة:</label><select id="animalFormBreed">${breedsOptions}</select></div>
        <div class="input-field"><label for="animalFormSex">الجنس:</label><select id="animalFormSex"><option value="male" ${animal && animal.sex === 'male' ? 'selected' : ''}>ذكر</option><option value="female" ${animal && animal.sex === 'female' ? 'selected' : ''}>أنثى</option></select></div>
        <div class="input-field"><label for="animalFormBirthDate">تاريخ الميلاد:</label><input type="date" id="animalFormBirthDate" value="${animal ? animal.birthDate : new Date().toISOString().split('T')[0]}"></div>
        <div class="input-field"><label for="animalFormSireId">الأب (ID/Tag):</label><input type="text" id="animalFormSireId" value="${animal ? animal.sireId || '' : ''}"></div>
        <div class="input-field"><label for="animalFormDamId">الأم (ID/Tag):</label><input type="text" id="animalFormDamId" value="${animal ? animal.damId || '' : ''}"></div>
        <div class="input-field"><label for="animalFormPurchaseDate">تاريخ الشراء:</label><input type="date" id="animalFormPurchaseDate" value="${animal ? animal.purchaseDate || '' : ''}"></div>
        <div class="input-field"><label for="animalFormPurchasePrice">سعر الشراء:</label><input type="number" id="animalFormPurchasePrice" value="${animal ? animal.purchasePrice || 0 : 0}" inputmode="numeric"></div>
        <div class="input-field"><label for="animalFormStatus">الحالة:</label><select id="animalFormStatus"><option value="active" ${animal && animal.status === 'active' ? 'selected' : ''}>نشط</option><option value="sold" ${animal && animal.status === 'sold' ? 'selected' : ''}>مباع</option><option value="culled_dead" ${animal && animal.status === 'culled_dead' ? 'selected' : ''}>مستبعد/نافق</option><option value="quarantined" ${animal && animal.status === 'quarantined' ? 'selected' : ''}>في الحجر</option></select></div>
        <div class="input-field"><label for="animalFormNotes">ملاحظات:</label><textarea id="animalFormNotes">${animal ? animal.notes || '' : ''}</textarea></div>
        <div class="input-field"><label for="animalFormInitialWeight">الوزن الحالي/الأولي (كجم):</label><input type="number" id="animalFormInitialWeight" value="${animal && animal.weightHistory && animal.weightHistory.length > 0 ? animal.weightHistory[animal.weightHistory.length-1].weight : 0}" step="0.1" inputmode="decimal"></div>
    `;
    openSfmFormModal(title, formHTML, 'saveAnimal', animalId, 'large');
    if(animal && animal.breed && !sfmData.settings.customBreeds.includes(animal.breed)) { const breedSelect = document.getElementById('animalFormBreed'); if(breedSelect) breedSelect.add(new Option(animal.breed, animal.breed, true, true)); }
}
function previewAnimalPhoto(event) { const reader = new FileReader(); const output = document.getElementById('animalPhotoPreview'); reader.onload = function(){ output.src = reader.result; output.style.display = 'block'; }; reader.readAsDataURL(event.target.files[0]); }

async function saveAnimal(animalId = null) {
    const tagId = getSfmStrVal('animalFormTagId');
    if (!tagId) { showSfmAppNotification("الرقم التعريفي مطلوب.", "error"); return; }
    const existingAnimalById = sfmData.animals.find(a => a.tagId === tagId && a.id !== animalId);
    if (existingAnimalById) { showSfmAppNotification("الرقم التعريفي مستخدم بالفعل.", "error"); return; }

    let photoDataUrl = null;
    const photoFile = document.getElementById('animalFormPhoto').files[0];
    if (photoFile) { try { photoDataUrl = await readFileAsDataURL(photoFile); } catch (e) { console.error("Error reading photo file:", e); showSfmAppNotification("خطأ في تحميل الصورة.", "error"); } }
    else if (animalId) { photoDataUrl = sfmData.animals.find(a=>a.id===animalId)?.photoDataUrl || null; }


    const animalData = {
        id: animalId || generateUUID(), tagId, name: getSfmStrVal('animalFormName'), photoDataUrl,
        breed: getSfmStrVal('animalFormBreed'), sex: getSfmStrVal('animalFormSex'), birthDate: getStrVal('animalFormBirthDate'),
        sireId: getSfmStrVal('animalFormSireId'), damId: getSfmStrVal('animalFormDamId'),
        purchaseDate: getStrVal('animalFormPurchaseDate') || null, purchasePrice: getSfmVal('animalFormPurchasePrice'),
        status: getSfmStrVal('animalFormStatus'), notes: getSfmStrVal('animalFormNotes'),
        weightHistory: animalId ? (sfmData.animals.find(a=>a.id===animalId)?.weightHistory || []) : [],
    };
    const initialWeight = getSfmVal('animalFormInitialWeight');
    if (initialWeight > 0 && (!animalId || animalData.weightHistory.length === 0)) { // Add initial weight if new or no history
        animalData.weightHistory.push({ date: animalData.birthDate || new Date().toISOString().split('T')[0], weight: initialWeight, type: 'initial' });
    }

    if (animalId) { const index = sfmData.animals.findIndex(a => a.id === animalId); if (index > -1) sfmData.animals[index] = animalData; }
    else { sfmData.animals.push(animalData); }
    saveSfmDataToLocalStorage(); renderAnimalList(); closeSfmFormModal(); renderDashboard();
    showSfmAppNotification(animalId ? "تم تحديث بيانات الحيوان." : "تم إضافة الحيوان.", "success");
}
function readFileAsDataURL(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }

function renderAnimalList() {
    const tableBody = document.getElementById('animalListTableBody');
    const noAnimalsMsg = document.getElementById('noAnimalsMessage');
    if (!tableBody || !noAnimalsMsg) return;
    const searchTerm = getStrVal('animalSearchInput').toLowerCase(); const filterBreed = getStrVal('animalFilterBreed');
    const filterSex = getStrVal('animalFilterSex'); const filterStatus = getStrVal('animalFilterStatus'); const sortBy = getStrVal('animalSortBy');
    let filteredAnimals = sfmData.animals.filter(animal =>
        (animal.tagId.toLowerCase().includes(searchTerm) || (animal.name && animal.name.toLowerCase().includes(searchTerm)) || animal.breed.toLowerCase().includes(searchTerm)) &&
        (!filterBreed || animal.breed === filterBreed) && (!filterSex || animal.sex === filterSex) && (!filterStatus || animal.status === filterStatus)
    );
    filteredAnimals.sort((a, b) => {
        if (sortBy === 'birthDate') return new Date(a.birthDate) - new Date(b.birthDate);
        if (sortBy === 'breed') return a.breed.localeCompare(b.breed, 'ar');
        return a.tagId.localeCompare(b.tagId, 'ar', {numeric: true});
    });
    if (filteredAnimals.length === 0) { tableBody.innerHTML = ''; noAnimalsMsg.style.display = 'block'; return; }
    noAnimalsMsg.style.display = 'none';
    tableBody.innerHTML = filteredAnimals.map(animal => `
        <tr>
            <td><input type="checkbox" class="animal-select-checkbox" data-animal-id="${animal.id}" onchange="updateBatchActionsBarVisibility()"></td>
            <td>${animal.tagId} ${animal.name ? `(<small>${animal.name}</small>)`:''}</td>
            <td><img src="${animal.photoDataUrl || 'placeholder_sheep.png'}" alt="صورة" class="animal-thumbnail" onerror="this.src='placeholder_sheep.png';"></td>
            <td>${animal.breed}</td>
            <td>${animal.sex === 'male' ? 'ذكر' : 'أنثى'}</td>
            <td>${calculateAge(animal.birthDate)}</td>
            <td class="status-${animal.status}">${getAnimalStatusText(animal.status)}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-secondary" onclick="openAnimalFormModal('${animal.id}')" title="تعديل">✏️</button>
                <button class="btn btn-sm btn-info" style="background-color:#17a2b8;" onclick="openWeightLogFormModal('${animal.id}')" title="تسجيل وزن">⚖️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSfmItem('animals', '${animal.id}', renderAnimalList)" title="حذف">🗑️</button>
            </td>
        </tr>`).join('');
    populateAnimalFilterDropdowns();
}
function filterAnimalList() { renderAnimalList(); }
function sortAndRenderAnimalList() { renderAnimalList(); }
function toggleSelectAllAnimals(checked) { document.querySelectorAll('.animal-select-checkbox').forEach(cb => cb.checked = checked); updateBatchActionsBarVisibility(); }
function updateBatchActionsBarVisibility() { const selectedCount = document.querySelectorAll('.animal-select-checkbox:checked').length; document.getElementById('animalBatchActionsBar').style.display = selectedCount > 0 ? 'flex' : 'none'; }
function handleAnimalBatchAction(action) { const selectedAnimalIds = Array.from(document.querySelectorAll('.animal-select-checkbox:checked')).map(cb => cb.dataset.animalId); if (selectedAnimalIds.length === 0) { showSfmAppNotification("يرجى تحديد حيوان واحد على الأقل.", "warn"); return; } console.log("Batch action:", action, "on animals:", selectedAnimalIds); showSfmAppNotification(`تم تنفيذ "${action}" على ${selectedAnimalIds.length} حيوان (وظيفة قيد التطوير).`, "info"); }

function populateAnimalFilterDropdowns() {
    const breedSelect = document.getElementById('animalFilterBreed');
    const statusSelect = document.getElementById('animalFilterStatus');
    if(breedSelect && breedSelect.options.length <=1) { const breeds = [...new Set(sfmData.animals.map(a => a.breed)), ...sfmData.settings.customBreeds]; [...new Set(breeds)].sort((a,b)=>a.localeCompare(b,'ar')).forEach(breed => breedSelect.add(new Option(breed, breed))); }
    if(statusSelect && statusSelect.options.length <=1) { const statuses = {'active':'نشط', 'sold':'مباع', 'culled_dead':'مستبعد/نافق', 'quarantined':'في الحجر'}; Object.entries(statuses).forEach(([val, text]) => statusSelect.add(new Option(text, val))); }
}
function calculateAge(birthDateStr) { if (!birthDateStr) return 'N/A'; const birthDate = new Date(birthDateStr); const today = new Date(); let years = today.getFullYear() - birthDate.getFullYear(); let months = today.getMonth() - birthDate.getMonth(); if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; } return years > 0 ? `${years} س و ${months} ش` : `${months} ش`; }
function getAnimalStatusText(status) { const statuses = {'active':'نشط', 'sold':'مباع', 'culled_dead':'مستبعد/نافق', 'quarantined':'في الحجر'}; return statuses[status] || status; }
function openWeightLogFormModal(animalId) {
    const animal = sfmData.animals.find(a => a.id === animalId);
    if (!animal) return;
    const latestWeight = animal.weightHistory && animal.weightHistory.length > 0 ? animal.weightHistory[animal.weightHistory.length -1].weight : 0;
    const formHTML = `
        <h4>تسجيل وزن لـ: ${animal.tagId} (${animal.name || animal.breed})</h4>
        <div class="input-field"><label for="weightLogDate">تاريخ الوزن:</label><input type="date" id="weightLogDate" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="input-field"><label for="weightLogWeight">الوزن (كجم):</label><input type="number" id="weightLogWeight" value="${latestWeight}" step="0.1" inputmode="decimal" min="0"></div>
        <div class="input-field"><label for="weightLogType">نوع الوزن:</label><select id="weightLogType"><option value="routine">دوري</option><option value="weaning">فطام</option><option value="pre_sale">قبل البيع</option><option value="birth">ميلاد</option></select></div>
    `;
    openSfmFormModal("تسجيل وزن جديد", formHTML, 'saveWeightLog', animalId);
}
function saveWeightLog(animalId) {
    const animal = sfmData.animals.find(a => a.id === animalId);
    if (!animal) return;
    const date = getStrVal('weightLogDate');
    const weight = getSfmVal('weightLogWeight');
    const type = getSfmStrVal('weightLogType');
    if (!date || weight <= 0) { showSfmAppNotification("يرجى إدخال تاريخ ووزن صحيحين.", "error"); return; }
    if (!animal.weightHistory) animal.weightHistory = [];
    animal.weightHistory.push({date, weight, type});
    animal.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date)); // Keep sorted
    saveSfmDataToLocalStorage();
    renderAnimalList(); // To refresh age or any other derived info if needed
    closeSfmFormModal();
    showSfmAppNotification("تم تسجيل الوزن بنجاح.", "success");
    renderDashboard(); // ADG might change
}


function openMatingFormModal(matingId = null) {
    const mating = matingId ? sfmData.matings.find(m => m.id === matingId) : null;
    const title = mating ? "تعديل سجل تزاوج" : "تسجيل تزاوج جديد";
    const ewesOptions = sfmData.animals.filter(a=>a.sex==='female' && a.status==='active').map(e => `<option value="${e.id}" ${mating && mating.eweId === e.id ? 'selected':''}>${e.tagId} (${e.name || e.breed})</option>`).join('');
    const ramsOptions = sfmData.animals.filter(a=>a.sex==='male' && a.status==='active').map(r => `<option value="${r.id}" ${mating && mating.ramId === r.id ? 'selected':''}>${r.tagId} (${r.name || r.breed})</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="matingFormEweId">النعجة:</label><select id="matingFormEweId" required>${ewesOptions}</select></div>
        <div class="input-field"><label for="matingFormRamId">الكبش:</label><select id="matingFormRamId" required>${ramsOptions}</select></div>
        <div class="input-field"><label for="matingFormDate">تاريخ التزاوج:</label><input type="date" id="matingFormDate" value="${mating ? mating.date : new Date().toISOString().split('T')[0]}" required></div>
        <div class="input-field"><label for="matingFormExpectedDueDate">تاريخ الولادة المتوقع:</label><input type="date" id="matingFormExpectedDueDate" value="${mating ? mating.expectedDueDate : ''}" readonly></div>
        <div class="input-field"><label for="matingFormStatus">الحالة:</label><select id="matingFormStatus"><option value="mated" ${mating && mating.status === 'mated' ? 'selected':''}>تم التلقيح</option><option value="pregnant" ${mating && mating.status === 'pregnant' ? 'selected':''}>عشار مؤكد</option><option value="lambed" ${mating && mating.status === 'lambed' ? 'selected':''}>ولدت</option><option value="failed" ${mating && mating.status === 'failed' ? 'selected':''}>فشل الحمل</option></select></div>
        <div class="input-field"><label for="matingFormNotes">ملاحظات:</label><textarea id="matingFormNotes">${mating ? mating.notes || '' : ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveMating', matingId);
    document.getElementById('matingFormDate').addEventListener('input', calculateMatingExpectedDueDate); // Use input for immediate update
    if(mating && !mating.expectedDueDate || !mating) calculateMatingExpectedDueDate();
}
function calculateMatingExpectedDueDate() { const matingDateStr = getStrVal('matingFormDate'); if(matingDateStr){ const matingDate = new Date(matingDateStr); matingDate.setDate(matingDate.getDate() + 150); setSfmVal('matingFormExpectedDueDate', matingDate.toISOString().split('T')[0]); }}
function saveMating(matingId = null) {
    const matingData = { id: matingId || generateUUID(), eweId: getSfmStrVal('matingFormEweId'), ramId: getSfmStrVal('matingFormRamId'), date: getStrVal('matingFormDate'), expectedDueDate: getStrVal('matingFormExpectedDueDate'), status: getSfmStrVal('matingFormStatus'), notes: getSfmStrVal('matingFormNotes') };
    if(!matingData.eweId || !matingData.ramId || !matingData.date) { showSfmAppNotification("يرجى ملء الحقول المطلوبة.", "error"); return; }
    if (matingId) { const index = sfmData.matings.findIndex(m => m.id === matingId); if (index > -1) sfmData.matings[index] = matingData; } else { sfmData.matings.push(matingData); }
    saveSfmDataToLocalStorage(); renderMatingRecords(); closeSfmFormModal(); renderDashboard();
    showSfmAppNotification(matingId ? "تم تحديث سجل التزاوج." : "تم تسجيل التزاوج.", "success");
}
function renderMatingRecords() {
    const tableBody = document.getElementById('matingRecordsTableBody'); const noMsg = document.getElementById('noMatingsMessage'); if(!tableBody || !noMsg) return;
    if (sfmData.matings.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    tableBody.innerHTML = sfmData.matings.sort((a,b) => new Date(b.date) - new Date(a.date)).map(mating => `<tr><td>${sfmData.animals.find(a=>a.id===mating.eweId)?.tagId || 'N/A'}</td><td>${sfmData.animals.find(a=>a.id===mating.ramId)?.tagId || 'N/A'}</td><td>${sfmFormatDate(mating.date)}</td><td>${sfmFormatDate(mating.expectedDueDate)}</td><td>${getMatingStatusText(mating.status)}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openMatingFormModal('${mating.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('matings', '${mating.id}', renderMatingRecords)">🗑️</button></td></tr>`).join('');
}
function getMatingStatusText(status){ const statuses = {mated: 'تم التلقيح', pregnant: 'عشار مؤكد', lambed: 'ولدت', failed: 'فشل الحمل'}; return statuses[status] || status; }

function openLambingFormModal(lambingId = null) {
    const lambing = lambingId ? sfmData.lambings.find(l => l.id === lambingId) : null;
    const title = lambing ? "تعديل سجل ولادة" : "تسجيل ولادة جديدة";
    const ewesOptions = sfmData.matings.filter(m => m.status === 'pregnant' || (m.status==='mated' && m.expectedDueDate && new Date(m.expectedDueDate) < new Date(Date.now() + 30*24*60*60*1000)))
                        .map(m => sfmData.animals.find(a => a.id === m.eweId)).filter(Boolean)
                        .map(e => `<option value="${e.id}" ${lambing && lambing.damId === e.id ? 'selected':''}>${e.tagId} (${e.name || e.breed})</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="lambingFormDamId">النعجة الأم:</label><select id="lambingFormDamId" required>${ewesOptions}</select></div>
        <div class="input-field"><label for="lambingFormDate">تاريخ الولادة:</label><input type="date" id="lambingFormDate" value="${lambing ? lambing.date : new Date().toISOString().split('T')[0]}" required></div>
        <div class="input-field"><label for="lambingFormLambsBornCount">عدد المواليد:</label><input type="number" id="lambingFormLambsBornCount" value="${lambing ? lambing.lambsBorn || 1 : 1}" min="1" inputmode="numeric"></div>
        <div id="lambDetailsContainer"></div> 
        <div class="input-field"><label for="lambingFormNotes">ملاحظات الولادة:</label><textarea id="lambingFormNotes">${lambing ? lambing.notes || '' : ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveLambing', lambingId, 'large');
    const lambsCountInput = document.getElementById('lambingFormLambsBornCount');
    if (lambsCountInput) { lambsCountInput.addEventListener('input', () => generateLambDetailInputs(lambsCountInput.value, lambing ? lambing.lambsData : null)); generateLambDetailInputs(lambsCountInput.value, lambing ? lambing.lambsData : null); }
}
function generateLambDetailInputs(count, existingLambsData = null) {
    const container = document.getElementById('lambDetailsContainer'); if (!container) return; container.innerHTML = '';
    for (let k = 0; k < count; k++) {
        const existingData = existingLambsData && existingLambsData[k] ? existingLambsData[k] : {};
        container.innerHTML += `<div class="card" style="margin-top:10px; background-color:#f9f9f9;"><strong>المولود ${k + 1}:</strong><div class="input-grid"><div class="input-field"><label for="lambTagId${k}">الرقم التعريفي للمولود:</label><input type="text" id="lambTagId${k}" value="${existingData.tagId || ''}" placeholder="ID للمولود (اختياري الآن)"></div><div class="input-field"><label for="lambSex${k}">جنس المولود:</label><select id="lambSex${k}"><option value="male" ${existingData.sex==='male' ? 'selected':''}>ذكر</option><option value="female" ${existingData.sex==='female' ? 'selected':''}>أنثى</option></select></div><div class="input-field"><label for="lambBirthWeight${k}">وزن الميلاد (كجم):</label><input type="number" id="lambBirthWeight${k}" value="${existingData.birthWeight || 0}" step="0.1" inputmode="decimal"></div></div></div>`;
    }
}
function saveLambing(lambingId = null) {
    const damId = getSfmStrVal('lambingFormDamId'); const date = getStrVal('lambingFormDate'); const lambsBornCount = parseInt(getVal('lambingFormLambsBornCount'));
    if(!damId || !date || lambsBornCount <= 0) {showSfmAppNotification("يرجى ملء بيانات الأم والتاريخ وعدد المواليد.", "error"); return;}
    const lambsData = [];
    for (let k = 0; k < lambsBornCount; k++) {
        const lambTagId = getSfmStrVal(`lambTagId${k}`); const lambSex = getSfmStrVal(`lambSex${k}`); const lambBirthWeight = getSfmVal(`lambBirthWeight${k}`);
        const lambUUID = (lambingId && sfmData.lambings.find(l=>l.id===lambingId)?.lambsData[k]?.id) || generateUUID(); // Preserve ID if editing
        lambsData.push({ tagId: lambTagId, sex: lambSex, birthWeight: lambBirthWeight, id: lambUUID });
        if(lambTagId) {
            const existingLamb = sfmData.animals.find(a => a.id === lambUUID || a.tagId === lambTagId);
            const dam = sfmData.animals.find(a => a.id === damId);
            const sireFromMating = sfmData.matings.find(m => m.eweId === damId && (m.status === 'pregnant' || m.status === 'lambed'));
            if(existingLamb) { // Update existing lamb if found by ID or new Tag ID
                existingLamb.tagId = lambTagId; existingLamb.sex = lambSex; existingLamb.birthDate = date; existingLamb.damId = damId;
                if(sireFromMating) existingLamb.sireId = sireFromMating.ramId;
                if (!existingLamb.weightHistory) existingLamb.weightHistory = [];
                const birthWeightEntry = existingLamb.weightHistory.find(wh => wh.type === 'birth');
                if(birthWeightEntry && lambBirthWeight > 0) birthWeightEntry.weight = lambBirthWeight;
                else if (lambBirthWeight > 0) existingLamb.weightHistory.push({date: date, weight: lambBirthWeight, type: 'birth'});
            } else if (!sfmData.animals.find(a => a.tagId === lambTagId)) { // Add as new only if Tag ID is unique
                sfmData.animals.push({ id: lambUUID, tagId: lambTagId, name: `مولود-${lambTagId}`, breed: dam ? dam.breed : sfmData.settings.customBreeds[0] || "بلدي", sex: lambSex, birthDate: date, damId: damId, sireId: sireFromMating ? sireFromMating.ramId : '', status: 'active', notes: `مولود بتاريخ ${date}`, weightHistory: lambBirthWeight > 0 ? [{date: date, weight: lambBirthWeight, type: 'birth'}] : [] });
            }
        }
    }
    const lambingData = { id: lambingId || generateUUID(), damId, date, lambsBorn: lambsBornCount, lambsData, notes: getSfmStrVal('lambingFormNotes') };
    if (lambingId) { const index = sfmData.lambings.findIndex(l => l.id === lambingId); if (index > -1) sfmData.lambings[index] = lambingData; }
    else { sfmData.lambings.push(lambingData); }
    const matingRecord = sfmData.matings.find(m => m.eweId === damId && (m.status === 'pregnant' || m.status === 'mated'));
    if(matingRecord) matingRecord.status = 'lambed';
    saveSfmDataToLocalStorage(); renderLambingRecords(); renderMatingRecords(); renderAnimalList(); closeSfmFormModal(); renderDashboard();
    showSfmAppNotification(lambingId ? "تم تحديث سجل الولادة." : "تم تسجيل الولادة.", "success");
}
function renderLambingRecords() {
    const tableBody = document.getElementById('lambingRecordsTableBody'); const noMsg = document.getElementById('noLambingsMessage'); if(!tableBody || !noMsg) return;
    if (sfmData.lambings.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    tableBody.innerHTML = sfmData.lambings.sort((a,b) => new Date(b.date) - new Date(a.date)).map(lambing => `<tr><td>${sfmData.animals.find(a=>a.id===lambing.damId)?.tagId || 'N/A'}</td><td>${sfmFormatDate(lambing.date)}</td><td>${lambing.lambsBorn}</td><td>${lambing.lambsData.map(l => l.tagId || '(جديد)').join(', ')}</td><td>${lambing.notes || '-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openLambingFormModal('${lambing.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('lambings', '${lambing.id}', renderLambingRecords)">🗑️</button></td></tr>`).join('');
}

function openWeaningFormModal(weaningId = null) {
    const weaning = weaningId ? sfmData.weanings.find(w => w.id === weaningId) : null;
    const title = weaning ? "تعديل سجل فطام" : "تسجيل فطام جديد";
    const lambsOptions = sfmData.animals.filter(a => isLamb(a.birthDate, 12) && a.status === 'active' && (!weaning || a.id === weaning.lambId || !sfmData.weanings.find(w => w.lambId === a.id)))
                        .map(lamb => `<option value="${lamb.id}" ${weaning && weaning.lambId === lamb.id ? 'selected':''}>${lamb.tagId} (${lamb.name || lamb.breed})</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="weaningFormLambId">الحمل المفطوم:</label><select id="weaningFormLambId" required>${lambsOptions}</select></div>
        <div class="input-field"><label for="weaningFormDate">تاريخ الفطام:</label><input type="date" id="weaningFormDate" value="${weaning ? weaning.date : new Date().toISOString().split('T')[0]}" required></div>
        <div class="input-field"><label for="weaningFormWeight">وزن الفطام (كجم):</label><input type="number" id="weaningFormWeight" value="${weaning ? weaning.weight || 0 : 0}" step="0.1" inputmode="decimal"></div>
        <div class="input-field"><label for="weaningFormNotes">ملاحظات الفطام:</label><textarea id="weaningFormNotes">${weaning ? weaning.notes || '' : ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveWeaning', weaningId);
}
function saveWeaning(weaningId = null) {
    const weaningData = { id: weaningId || generateUUID(), lambId: getSfmStrVal('weaningFormLambId'), date: getStrVal('weaningFormDate'), weight: getSfmVal('weaningFormWeight'), notes: getSfmStrVal('weaningFormNotes') };
    if(!weaningData.lambId || !weaningData.date) {showSfmAppNotification("يرجى اختيار الحمل وتاريخ الفطام.","error"); return;}
    const lamb = sfmData.animals.find(a => a.id === weaningData.lambId);
    if (lamb && weaningData.weight > 0) { if (!lamb.weightHistory) lamb.weightHistory = []; lamb.weightHistory.push({date: weaningData.date, weight: weaningData.weight, type: 'weaning'}); lamb.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date));}
    if (weaningId) { const index = sfmData.weanings.findIndex(w => w.id === weaningId); if (index > -1) sfmData.weanings[index] = weaningData; } else { sfmData.weanings.push(weaningData); }
    saveSfmDataToLocalStorage(); renderWeaningRecords(); closeSfmFormModal();
    showSfmAppNotification(weaningId ? "تم تحديث سجل الفطام." : "تم تسجيل الفطام.", "success");
}
function renderWeaningRecords(){
    const tableBody = document.getElementById('weaningRecordsTableBody'); const noMsg = document.getElementById('noWeaningsMessage'); if(!tableBody || !noMsg) return;
    const weaningsToDisplay = sfmData.weanings.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (weaningsToDisplay.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    tableBody.innerHTML = weaningsToDisplay.map(weaning => { const lamb = sfmData.animals.find(a => a.id === weaning.lambId); return `<tr><td>${lamb ? (lamb.tagId || lamb.name || 'N/A') : 'N/A'}</td><td>${sfmFormatDate(weaning.date)}</td><td>${weaning.weight || '-'} كجم</td><td>${weaning.notes || '-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openWeaningFormModal('${weaning.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('weanings', '${weaning.id}', renderWeaningRecords)">🗑️</button></td></tr>`}).join('');
}

function openHealthRecordFormModal(recordId = null) {
    const record = recordId ? sfmData.healthRecords.find(hr => hr.id === recordId) : null;
    const title = record ? "تعديل سجل صحي" : "إضافة سجل صحي جديد";
    const animalsOptions = sfmData.animals.filter(a => a.status === 'active').map(a => `<option value="${a.id}" ${record && record.animalId === a.id ? 'selected':''}>${a.tagId} (${a.name || a.breed})</option>`).join('');
    const medicationOptions = sfmData.inventory.filter(item => item.type === 'medication').map(med => `<option value="${med.name}" ${record && record.medication === med.name ? 'selected':''}>${med.name} (المتاح: ${med.currentStock} ${med.unit})</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="healthFormAnimalId">الحيوان:</label><select id="healthFormAnimalId" required>${animalsOptions}</select></div>
        <div class="input-field"><label for="healthFormDate">التاريخ:</label><input type="date" id="healthFormDate" value="${record ? record.date : new Date().toISOString().split('T')[0]}" required></div>
        <div class="input-field"><label for="healthFormRecordType">نوع الإجراء:</label><select id="healthFormRecordType"><option value="treatment" ${record && record.type === 'treatment' ? 'selected':''}>علاج</option><option value="vaccination" ${record && record.type === 'vaccination' ? 'selected':''}>تحصين</option><option value="deworming" ${record && record.type === 'deworming' ? 'selected':''}>مكافحة طفيليات</option><option value="checkup" ${record && record.type === 'checkup' ? 'selected':''}>فحص دوري</option></select></div>
        <div class="input-field"><label for="healthFormCondition">التشخيص/التحصين:</label><input type="text" id="healthFormCondition" value="${record ? record.condition || '' : ''}" required></div>
        <div class="input-field"><label for="healthFormMedication">العلاج/الدواء (إن وجد):</label><select id="healthFormMedication"><option value="">-- اختر من المخزون --</option>${medicationOptions}</select><input type="text" id="healthFormMedicationCustom" placeholder="أو اكتب اسم دواء غير موجود" value="${record && !medicationOptions.includes(record.medication) ? record.medication : ''}"></div>
        <div class="input-field"><label for="healthFormDosage">الجرعة:</label><input type="text" id="healthFormDosage" value="${record ? record.dosage || '' : ''}"></div>
        <div class="input-field"><label for="healthFormWithdrawalPeriod">فترة السحب (أيام):</label><input type="number" id="healthFormWithdrawalPeriod" value="${record ? record.withdrawalPeriod || 0 : 0}" inputmode="numeric" min="0"></div>
        <div class="input-field"><label for="healthFormNextDueDate">تاريخ المتابعة/الجرعة التالية:</label><input type="date" id="healthFormNextDueDate" value="${record ? record.nextDueDate || '' : ''}"></div>
        <div class="input-field"><label for="healthFormNotes">ملاحظات:</label><textarea id="healthFormNotes">${record ? record.notes || '' : ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveHealthRecord', recordId);
}
function saveHealthRecord(recordId = null) {
    const medicationFromSelect = getSfmStrVal('healthFormMedication');
    const medicationCustom = getSfmStrVal('healthFormMedicationCustom');
    const healthData = {
        id: recordId || generateUUID(), animalId: getSfmStrVal('healthFormAnimalId'), date: getStrVal('healthFormDate'), type: getSfmStrVal('healthFormRecordType'),
        condition: getSfmStrVal('healthFormCondition'), medication: medicationCustom || medicationFromSelect, dosage: getSfmStrVal('healthFormDosage'),
        withdrawalPeriod: getSfmVal('healthFormWithdrawalPeriod'), nextDueDate: getStrVal('healthFormNextDueDate') || null, notes: getSfmStrVal('healthFormNotes')
    };
    if(!healthData.animalId || !healthData.date || !healthData.condition) {showSfmAppNotification("يرجى اختيار الحيوان وملء التاريخ والتشخيص/التحصين.", "error"); return;}
    if (healthData.medication) { // Attempt to deduct from inventory if medication from select
        const invItem = sfmData.inventory.find(item => item.name === healthData.medication && item.type === 'medication');
        if (invItem) { /* TODO: Add logic to input quantity used and deduct from invItem.currentStock */ }
    }
    if (recordId) { const index = sfmData.healthRecords.findIndex(hr => hr.id === recordId); if (index > -1) sfmData.healthRecords[index] = healthData; }
    else { sfmData.healthRecords.push(healthData); }
    saveSfmDataToLocalStorage(); renderHealthRecords(); closeSfmFormModal(); renderDashboard();
    showSfmAppNotification(recordId ? "تم تحديث السجل الصحي." : "تم إضافة السجل الصحي.", "success");
}
function renderHealthRecords() {
    const tableBody = document.getElementById('healthRecordsTableBody'); const noMsg = document.getElementById('noHealthRecordsMessage'); if(!tableBody || !noMsg) return;
    const searchTerm = getStrVal('healthSearchInput').toLowerCase();
    const filteredRecords = sfmData.healthRecords.filter(hr => { const animal = sfmData.animals.find(a => a.id === hr.animalId); return (animal && (animal.tagId.toLowerCase().includes(searchTerm) || (animal.name && animal.name.toLowerCase().includes(searchTerm)))) || hr.condition.toLowerCase().includes(searchTerm) || (hr.medication && hr.medication.toLowerCase().includes(searchTerm)); }).sort((a,b) => new Date(b.date) - new Date(a.date));
    if (filteredRecords.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    tableBody.innerHTML = filteredRecords.map(hr => { const animal = sfmData.animals.find(a => a.id === hr.animalId); return `<tr><td>${animal ? animal.tagId : 'محذوف'}</td><td>${sfmFormatDate(hr.date)}</td><td>${getHealthRecordTypeText(hr.type)}</td><td>${hr.condition}</td><td>${hr.medication || '-'}</td><td>${hr.withdrawalPeriod > 0 ? hr.withdrawalPeriod + ' يوم' : '-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openHealthRecordFormModal('${hr.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('healthRecords', '${hr.id}', renderHealthRecords)">🗑️</button></td></tr>`; }).join('');
}
function filterHealthRecords(){ renderHealthRecords(); }
function getHealthRecordTypeText(type){ const types = {treatment:'علاج', vaccination:'تحصين', deworming:'مكافحة طفيليات', checkup:'فحص دوري'}; return types[type] || type; }

function openFeedRationFormModal(rationId = null) {
    const ration = rationId ? sfmData.feedRations.find(r => r.id === rationId) : null; const title = ration ? "تعديل خلطة علف" : "إضافة خلطة علف جديدة";
    let compositionHTML = '<div id="rationCompositionContainer">'; const existingCompositions = ration ? ration.composition : [{ingredientId: '', percentage: ''}];
    existingCompositions.forEach((comp, index) => { compositionHTML += `<div class="input-grid-3 ration-ingredient-row" style="align-items:flex-end; margin-bottom:8px;"><div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientId${index}">المكون:</label><select id="ingredientId${index}">${getFeedInventoryOptionsForRation(comp.ingredientId)}</select></div><div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientPercentage${index}">النسبة (%):</label><input type="number" id="ingredientPercentage${index}" value="${comp.percentage || ''}" min="0" max="100" step="0.1" inputmode="decimal"></div><button type="button" class="btn btn-sm btn-danger" style="height:36px; padding:0 8px; margin-bottom:0;" onclick="removeRationIngredientRow(this)">✕</button></div>`; });
    compositionHTML += '</div><button type="button" class="btn btn-sm btn-secondary" onclick="addRationIngredientRow()">إضافة مكون آخر</button>';
    const formHTML = `<div class="input-field"><label for="feedRationName">اسم الخلطة/المجموعة:</label><input type="text" id="feedRationName" value="${ration ? ration.name : ''}" required></div>${compositionHTML}<div class="input-field" style="margin-top:15px;"><label for="feedRationNotes">ملاحظات الخلطة:</label><textarea id="feedRationNotes">${ration ? ration.notes || '' : ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveFeedRation', rationId, 'large');
}
function getFeedInventoryOptionsForRation(selectedIngredientId = null) { return sfmData.inventory.filter(item => item.type === 'feed').map(item => `<option value="${item.id}" ${selectedIngredientId === item.id ? 'selected':''}>${item.name}</option>`).join(''); }
function addRationIngredientRow() { const container = document.getElementById('rationCompositionContainer'); if(!container) return; const index = container.children.length; const newRow = document.createElement('div'); newRow.className = 'input-grid-3 ration-ingredient-row'; newRow.style.alignItems = 'flex-end'; newRow.style.marginBottom = '8px'; newRow.innerHTML = `<div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientId${index}">المكون:</label><select id="ingredientId${index}">${getFeedInventoryOptionsForRation()}</select></div><div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientPercentage${index}">النسبة (%):</label><input type="number" id="ingredientPercentage${index}" value="" min="0" max="100" step="0.1" inputmode="decimal"></div><button type="button" class="btn btn-sm btn-danger" style="height:36px; padding:0 8px; margin-bottom:0;" onclick="removeRationIngredientRow(this)">✕</button>`; container.appendChild(newRow); }
function removeRationIngredientRow(button) { button.parentElement.remove(); }
function saveFeedRation(rationId = null) {
    const name = getSfmStrVal('feedRationName'); if (!name) { showSfmAppNotification("اسم الخلطة مطلوب.", "error"); return; } const composition = [];
    const ingredientRows = document.querySelectorAll('#rationCompositionContainer .ration-ingredient-row'); let totalPercentage = 0;
    for (let k = 0; k < ingredientRows.length; k++) { const ingredientId = getSfmStrVal(`ingredientId${k}`); const percentage = getSfmVal(`ingredientPercentage${k}`); if (ingredientId && percentage > 0) { composition.push({ ingredientId, percentage }); totalPercentage += percentage; }}
    if (composition.length === 0) { showSfmAppNotification("يجب إضافة مكون واحد على الأقل.", "error"); return; }
    if (Math.abs(totalPercentage - 100) > 1) { showSfmAppNotification("مجموع نسب المكونات يجب أن يكون 100% تقريباً.", "error"); return; }
    const rationData = { id: rationId || generateUUID(), name, composition, notes: getSfmStrVal('feedRationNotes') };
    if (rationId) { const index = sfmData.feedRations.findIndex(r => r.id === rationId); if (index > -1) sfmData.feedRations[index] = rationData; } else { sfmData.feedRations.push(rationData); }
    saveSfmDataToLocalStorage(); populateFeedRationSelect(); displaySelectedRation(); closeSfmFormModal();
    showSfmAppNotification(rationId ? "تم تحديث الخلطة." : "تم حفظ الخلطة.", "success");
}
function populateFeedRationSelect() { const select = document.getElementById('feedRationSelect'); if(!select) return; const currentVal = select.value; select.innerHTML = '<option value="">-- اختر خلطة --</option>'; sfmData.feedRations.forEach(ration => select.add(new Option(ration.name, ration.id))); if(sfmData.feedRations.find(r=>r.id === currentVal)) select.value = currentVal; }
function displaySelectedRation() {
    const rationId = getStrVal('feedRationSelect'); const displayArea = document.getElementById('feedRationDetailsDisplay'); if(!displayArea) return;
    const ration = sfmData.feedRations.find(r => r.id === rationId);
    if (ration) { let html = `<h5>مكونات ${ration.name}:</h5><ul style="padding-right:20px; margin-bottom:10px;">`; ration.composition.forEach(comp => { const ingredient = sfmData.inventory.find(item => item.id === comp.ingredientId); html += `<li>${ingredient ? ingredient.name : 'مكون محذوف'}: ${comp.percentage}%</li>`; }); html += `</ul>${ration.notes ? `<p><em>ملاحظات: ${ration.notes}</em></p>` : ''}`; html += `<button class="btn btn-sm btn-secondary" onclick="openFeedRationFormModal('${ration.id}')">تعديل</button>`; displayArea.innerHTML = html; }
    else { displayArea.innerHTML = '<p style="text-align:center; color:#888;">اختر خلطة لعرض تفاصيلها.</p>'; }
}
function openFeedConsumptionLogModal() {
    const rationsOptions = sfmData.feedRations.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    const animalsOrGroupsOptions = sfmData.animals.map(a => `<option value="${a.id}">${a.tagId} (${a.name || a.breed})</option>`).join(''); // Can be expanded to groups
    const formHTML = `
        <div class="input-field"><label for="feedLogDate">التاريخ:</label><input type="date" id="feedLogDate" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="input-field"><label for="feedLogRationId">الخلطة المستخدمة:</label><select id="feedLogRationId">${rationsOptions}</select></div>
        <div class="input-field"><label for="feedLogTarget">الحيوان/المجموعة:</label><select id="feedLogTarget"><option value="all_flock">القطيع كله</option>${animalsOrGroupsOptions}</select></div>
        <div class="input-field"><label for="feedLogAmount">الكمية المستهلكة (كجم):</label><input type="number" id="feedLogAmount" min="0" step="0.1" inputmode="decimal"></div>
        <div class="input-field"><label for="feedLogNotes">ملاحظات:</label><textarea id="feedLogNotes"></textarea></div>`;
    openSfmFormModal("تسجيل استهلاك علف", formHTML, 'saveFeedConsumptionLog');
}
function saveFeedConsumptionLog() {
    const logEntry = {
        id: generateUUID(), date: getStrVal('feedLogDate'), rationId: getSfmStrVal('feedLogRationId'),
        target: getSfmStrVal('feedLogTarget'), amount: getSfmVal('feedLogAmount'), notes: getSfmStrVal('feedLogNotes')
    };
    if(!logEntry.date || !logEntry.rationId || !logEntry.target || logEntry.amount <=0) {showSfmAppNotification("يرجى ملء جميع الحقول المطلوبة بكميات صحيحة.","error"); return;}
    
    // Deduct from inventory - find ingredients of rationId and deduct proportionally
    const ration = sfmData.feedRations.find(r => r.id === logEntry.rationId);
    if (ration) {
        ration.composition.forEach(comp => {
            const invItem = sfmData.inventory.find(item => item.id === comp.ingredientId);
            if (invItem) {
                const amountToDeduct = logEntry.amount * (comp.percentage / 100);
                invItem.currentStock = Math.max(0, invItem.currentStock - amountToDeduct);
            }
        });
    }
    sfmData.feedConsumptionLog.push(logEntry); saveSfmDataToLocalStorage(); closeSfmFormModal(); renderInventoryList();
    showSfmAppNotification("تم تسجيل استهلاك العلف وتحديث المخزون.", "success");
}
function logWaterConsumption() {
    const date = getStrVal('waterConsumptionDate'); const amount = getSfmVal('waterConsumptionAmount');
    if(!date || amount <=0) { showSfmAppNotification("يرجى إدخال تاريخ وكمية صالحة لاستهلاك المياه.", "error"); return; }
    sfmData.waterLog.push({date, amount, id: generateUUID()}); saveSfmDataToLocalStorage();
    showSfmAppNotification(`تم تسجيل ${amount} لتر ماء ليوم ${sfmFormatDate(date)}.`, "success");
    setVal('waterConsumptionAmount', 0); renderWaterLog();
}
function renderWaterLog() {
    const display = document.getElementById('waterLogDisplay');
    if(!display) return;
    const recentLogs = sfmData.waterLog.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5); // Show last 5
    if(recentLogs.length === 0) { display.innerHTML = '<p class="list-empty-message">لا يوجد سجل لاستهلاك المياه.</p>'; return; }
    display.innerHTML = '<h5>آخر تسجيلات استهلاك المياه:</h5><ul class="task-list" style="font-size:0.9em;">' + recentLogs.map(log => `<li><span>${sfmFormatDate(log.date)}:</span><strong>${log.amount} لتر</strong></li>`).join('') + '</ul>';
}

function openInventoryItemFormModal(itemId = null) {
    const item = itemId ? sfmData.inventory.find(i => i.id === itemId) : null;
    const title = item ? "تعديل عنصر المخزون" : "إضافة عنصر جديد للمخزون";
    const currentFeedTypes = sfmData.settings.customFeedTypes || [];
    const feedTypesOptions = currentFeedTypes.map(ft => `<option value="${ft}" ${item && item.name === ft && item.type==='feed' ? 'selected':''}>${ft}</option>`).join('');

    const formHTML = `
        <div class="input-field"><label for="inventoryFormItemType">نوع العنصر:</label><select id="inventoryFormItemType" onchange="toggleInventoryCustomNameField(this.value)">
            <option value="feed" ${item && item.type === 'feed' ? 'selected':''}>علف</option>
            <option value="medication" ${item && item.type === 'medication' ? 'selected':''}>دواء</option>
            <option value="supply" ${item && item.type === 'supply' ? 'selected':''}>مستلزمات</option>
            <option value="product" ${item && item.type === 'product' ? 'selected':''}>منتج للبيع</option>
        </select></div>
        <div id="inventoryCustomFeedTypeDiv" class="input-field" style="display:${(item && item.type === 'feed') || !item ? 'block':'none'};">
             <label for="inventoryFormItemFeedType">اختر نوع العلف (أو اترك للاسم المخصص):</label> <select id="inventoryFormItemFeedType"><option value="">-- اسم مخصص --</option>${feedTypesOptions}</select>
        </div>
        <div class="input-field"><label for="inventoryFormItemName">اسم العنصر:</label><input type="text" id="inventoryFormItemName" value="${item ? item.name : ''}" required></div>
        <div class="input-field"><label for="inventoryFormItemUnit">وحدة القياس:</label><input type="text" id="inventoryFormItemUnit" value="${item ? item.unit : 'كجم'}" placeholder="كجم، لتر، قطعة..."></div>
        <div class="input-field"><label for="inventoryFormItemStock">الكمية الحالية:</label><input type="number" id="inventoryFormItemStock" value="${item ? item.currentStock : 0}" inputmode="numeric" min="0"></div>
        <div class="input-field"><label for="inventoryFormItemReorderLevel">حد إعادة الطلب:</label><input type="number" id="inventoryFormItemReorderLevel" value="${item ? item.reorderLevel || 0 : 0}" inputmode="numeric" min="0"></div>`;
    openSfmFormModal(title, formHTML, 'saveInventoryItem', itemId);
    toggleInventoryCustomNameField(getStrVal('inventoryFormItemType')); // Initial state
    const feedTypeSelect = document.getElementById('inventoryFormItemFeedType');
    if(feedTypeSelect && item && item.type==='feed' && currentFeedTypes.includes(item.name)) {
         feedTypeSelect.value = item.name;
         document.getElementById('inventoryFormItemName').readOnly = true; // Set readOnly if selected from dropdown
    }
    feedTypeSelect?.addEventListener('change', function(){
        const nameField = document.getElementById('inventoryFormItemName');
        if(this.value) { nameField.value = this.value; nameField.readOnly = true; }
        else { nameField.readOnly = false; }
    });
}
function toggleInventoryCustomNameField(itemType) {
    const nameField = document.getElementById('inventoryFormItemName');
    const customDiv = document.getElementById('inventoryCustomFeedTypeDiv');
    if(!nameField || !customDiv) return;
    if (itemType === 'feed') { customDiv.style.display = 'block'; if(getStrVal('inventoryFormItemFeedType')) {nameField.value = getStrVal('inventoryFormItemFeedType'); nameField.readOnly = true;} else {nameField.readOnly = false;} }
    else { customDiv.style.display = 'none'; nameField.readOnly = false; }
}
function saveInventoryItem(itemId = null) {
    let itemName = getSfmStrVal('inventoryFormItemName'); const itemType = getSfmStrVal('inventoryFormItemType');
    if (itemType === 'feed' && getSfmStrVal('inventoryFormItemFeedType')) itemName = getSfmStrVal('inventoryFormItemFeedType');
    if (!itemName) { showSfmAppNotification("اسم العنصر مطلوب.", "error"); return; }
    const itemData = { id: itemId || generateUUID(), name: itemName, type: itemType, unit: getSfmStrVal('inventoryFormItemUnit') || 'وحدة', currentStock: getSfmVal('inventoryFormItemStock'), reorderLevel: getSfmVal('inventoryFormItemReorderLevel') };
    if (itemId) { const index = sfmData.inventory.findIndex(i => i.id === itemId); if (index > -1) sfmData.inventory[index] = itemData; } else { sfmData.inventory.push(itemData); }
    saveSfmDataToLocalStorage(); renderInventoryList(); populateFeedRationSelect(); renderDashboard(); closeSfmFormModal();
    showSfmAppNotification(itemId ? "تم تحديث عنصر المخزون." : "تمت إضافة عنصر للمخزون.", "success");
}
function renderInventoryList() {
    const tableBody = document.getElementById('inventoryTableBody'); const noMsg = document.getElementById('noInventoryMessage'); if(!tableBody || !noMsg) return;
    const searchTerm = getStrVal('inventorySearchInput').toLowerCase(); const filterType = getStrVal('inventoryFilterType');
    const filteredItems = sfmData.inventory.filter(item => (item.name.toLowerCase().includes(searchTerm) || item.type.toLowerCase().includes(searchTerm)) && (!filterType || item.type === filterType)).sort((a,b) => a.name.localeCompare(b.name, 'ar'));
    if (filteredItems.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    tableBody.innerHTML = filteredItems.map(item => `<tr class="${item.currentStock < item.reorderLevel && item.reorderLevel > 0 ? 'low-stock-warning' : ''}"><td>${item.name}</td><td>${getInventoryTypeText(item.type)}</td><td>${item.currentStock}</td><td>${item.unit}</td><td>${item.reorderLevel}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openInventoryItemFormModal('${item.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('inventory', '${item.id}', renderInventoryList)">🗑️</button></td></tr>`).join('');
}
function filterInventoryList() { renderInventoryList(); }
function getInventoryTypeText(type){ const types = {feed:'علف', medication:'دواء', supply:'مستلزمات', product:'منتج للبيع'}; return types[type] || type; }

function openTaskFormModal(taskId = null) {
    const task = taskId ? sfmData.tasks.find(t => t.id === taskId) : null; const title = task ? "تعديل مهمة" : "إضافة مهمة جديدة";
    const animalOptions = sfmData.animals.map(a => `<option value="${a.id}" ${task && task.relatedAnimalId === a.id ? 'selected':''}>${a.tagId} (${a.name||a.breed})</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="taskFormTitle">عنوان المهمة:</label><input type="text" id="taskFormTitle" value="${task ? task.title : ''}" required></div>
        <div class="input-field"><label for="taskFormDescription">الوصف:</label><textarea id="taskFormDescription">${task ? task.description || '' : ''}</textarea></div>
        <div class="input-field"><label for="taskFormDueDate">تاريخ الاستحقاق:</label><input type="date" id="taskFormDueDate" value="${task ? task.dueDate : new Date().toISOString().split('T')[0]}" required></div>
        <div class="input-field"><label for="taskFormPriority">الأولوية:</label><select id="taskFormPriority"><option value="low" ${task && task.priority === 'low' ? 'selected':''}>منخفضة</option><option value="medium" ${task && task.priority === 'medium' ? 'selected': sfmData.settings.defaultTaskPriority === 'medium'}>متوسطة</option><option value="high" ${task && task.priority === 'high' ? 'selected':''}>عالية</option></select></div>
        <div class="input-field"><label for="taskFormStatus">الحالة:</label><select id="taskFormStatus"><option value="pending" ${task && task.status === 'pending' ? 'selected': sfmData.settings.defaultTaskStatus === 'pending'}>معلقة</option><option value="in_progress" ${task && task.status === 'in_progress' ? 'selected':''}>قيد التنفيذ</option><option value="completed" ${task && task.status === 'completed' ? 'selected':''}>مكتملة</option></select></div>
        <div class="input-field"><label for="taskFormAssignedTo">مُسندة إلى:</label><input type="text" id="taskFormAssignedTo" value="${task ? task.assignedTo || '' : ''}"></div>
        <div class="input-field"><label for="taskFormRelatedAnimalId">مرتبطة بالحيوان:</label><select id="taskFormRelatedAnimalId"><option value="">-- لا يوجد --</option>${animalOptions}</select></div>`;
    openSfmFormModal(title, formHTML, 'saveTask', taskId);
    if(task && task.relatedAnimalId) document.getElementById('taskFormRelatedAnimalId').value = task.relatedAnimalId;
}
function saveTask(taskId = null) {
    const taskData = { id: taskId || generateUUID(), title: getSfmStrVal('taskFormTitle'), description: getSfmStrVal('taskFormDescription'), dueDate: getStrVal('taskFormDueDate'), priority: getSfmStrVal('taskFormPriority'), status: getSfmStrVal('taskFormStatus'), assignedTo: getSfmStrVal('taskFormAssignedTo'), relatedAnimalId: getSfmStrVal('taskFormRelatedAnimalId') || null, createdAt: taskId ? sfmData.tasks.find(t=>t.id===taskId).createdAt : new Date().toISOString() };
    if(!taskData.title || !taskData.dueDate) {showSfmAppNotification("عنوان المهمة وتاريخ الاستحقاق مطلوبان.","error"); return;}
    if (taskId) { const index = sfmData.tasks.findIndex(t => t.id === taskId); if (index > -1) sfmData.tasks[index] = taskData; } else { sfmData.tasks.push(taskData); }
    saveSfmDataToLocalStorage(); renderTaskList(); renderDashboard(); closeSfmFormModal();
    showSfmAppNotification(taskId ? "تم تحديث المهمة." : "تمت إضافة المهمة.", "success");
}
function renderTaskList() {
    const container = document.getElementById('taskListContainer'); const noMsg = document.getElementById('noTasksToListMessage'); if(!container || !noMsg) return;
    const filterStatus = getStrVal('taskFilterStatus'); const filterPriority = getStrVal('taskFilterPriority'); const sortBy = getStrVal('taskSortByDate');
    let filteredTasks = sfmData.tasks.filter(task => (filterStatus === 'all' || task.status === filterStatus) && (filterPriority === 'all' || task.priority === filterPriority));
    filteredTasks.sort((a, b) => sortBy === 'dueDateDesc' ? new Date(b.dueDate) - new Date(a.dueDate) : new Date(a.dueDate) - new Date(b.dueDate));
    if (filteredTasks.length === 0) { container.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    container.innerHTML = filteredTasks.map(task => `<div class="card task-item status-${task.status} priority-${task.priority}" style="border-left: 5px solid ${task.priority === 'high' ? '#e74c3c' : task.priority === 'medium' ? '#f39c12' : '#27ae60'};"><div class="card-header" style="padding-bottom:5px; margin-bottom:8px;"><h5 class="card-title" style="font-size:1em; ${task.status === 'completed' ? 'text-decoration:line-through; color:#888;' : ''}">${task.title}</h5><div class="task-actions">${task.status !== 'completed' ? `<button class="btn btn-sm btn-success" style="padding:3px 6px; font-size:0.8em;" onclick="completeTask('${task.id}')">✓ إكمال</button>` : ''}<button class="btn btn-sm btn-secondary" style="padding:3px 6px; font-size:0.8em;" onclick="openTaskFormModal('${task.id}')">✏️</button><button class="btn btn-sm btn-danger" style="padding:3px 6px; font-size:0.8em;" onclick="deleteSfmItem('tasks', '${task.id}', renderTaskList)">🗑️</button></div></div><p style="font-size:0.9em; color:#555; margin-bottom:5px;">${task.description || 'لا يوجد وصف.'}</p><small style="color:#777;">الاستحقاق: ${sfmFormatDate(task.dueDate)} | الحالة: ${getTaskStatusText(task.status)} ${task.assignedTo ? '| مُسندة إلى: '+task.assignedTo : ''} ${task.relatedAnimalId ? '| حيوان: '+ (sfmData.animals.find(a=>a.id===task.relatedAnimalId)?.tagId || task.relatedAnimalId.slice(0,6)) : ''}</small></div>`).join('');
}
function completeTask(taskId) { const task = sfmData.tasks.find(t => t.id === taskId); if (task) { task.status = 'completed'; saveSfmDataToLocalStorage(); renderTaskList(); renderDashboard(); }}
function getTaskStatusText(status){ const statuses = {pending:'معلقة', in_progress:'قيد التنفيذ', completed:'مكتملة'}; return statuses[status] || status; }

function openTransactionFormModal(transactionId = null, typeOverride = null) {
    const transaction = transactionId ? sfmData.transactions.find(t => t.id === transactionId) : null;
    const type = typeOverride || (transaction ? transaction.type : 'sale');
    const title = transaction ? "تعديل معاملة" : (type === 'sale' ? "تسجيل بيع" : (type === 'purchase' ? "تسجيل شراء" : "تسجيل مصروف"));
    const animalsOptions = sfmData.animals.filter(a=>a.status === 'active').map(a => `<option value="${a.id}" ${transaction && transaction.relatedAnimalId === a.id ? 'selected':''}>${a.tagId} (${a.name||a.breed})</option>`).join('');
    const formHTML = `
        <div class="input-field"><label for="transactionFormDate">التاريخ:</label><input type="date" id="transactionFormDate" value="${transaction ? transaction.date : new Date().toISOString().split('T')[0]}" required></div>
        <div class="input-field"><label for="transactionFormType">نوع المعاملة:</label><select id="transactionFormType"><option value="sale" ${type === 'sale' ? 'selected':''}>بيع</option><option value="purchase" ${type === 'purchase' ? 'selected':''}>شراء</option><option value="expense" ${type === 'expense' ? 'selected':''}>مصروفات أخرى</option></select></div>
        <div class="input-field"><label for="transactionFormDescription">الوصف/البيان:</label><input type="text" id="transactionFormDescription" value="${transaction ? transaction.description : ''}" required></div>
        <div class="input-field"><label for="transactionFormAmount">المبلغ (${sfmData.settings.defaultCurrency}):</label><input type="number" id="transactionFormAmount" value="${transaction ? transaction.amount : 0}" inputmode="numeric" required min="0.01"></div>
        <div class="input-field"><label for="transactionFormParty">العميل/المورد/الجهة:</label><input type="text" id="transactionFormParty" value="${transaction ? transaction.party || '' : ''}"></div>
        <div class="input-field"><label for="transactionFormAnimalId">الحيوان المرتبط (إن وجد):</label><select id="transactionFormAnimalId"><option value="">-- لا يوجد --</option>${animalsOptions}</select></div>
        <div class="input-field"><label for="transactionFormNotes">ملاحظات:</label><textarea id="transactionFormNotes">${transaction ? transaction.notes || '' : ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveTransaction', transactionId);
    if(transaction && transaction.relatedAnimalId) document.getElementById('transactionFormAnimalId').value = transaction.relatedAnimalId;
}
function saveTransaction(transactionId = null) {
    const transactionData = { id: transactionId || generateUUID(), date: getStrVal('transactionFormDate'), type: getSfmStrVal('transactionFormType'), description: getSfmStrVal('transactionFormDescription'), amount: getSfmVal('transactionFormAmount'), party: getSfmStrVal('transactionFormParty'), relatedAnimalId: getSfmStrVal('transactionFormAnimalId') || null, notes: getSfmStrVal('transactionFormNotes') };
    if(!transactionData.date || !transactionData.description || transactionData.amount <= 0) {showSfmAppNotification("يرجى ملء التاريخ والوصف والمبلغ بشكل صحيح.", "error"); return;}
    if(transactionData.type === 'sale' && transactionData.relatedAnimalId) { const animal = sfmData.animals.find(a => a.id === transactionData.relatedAnimalId); if (animal) animal.status = 'sold'; }
    if (transactionId) { const index = sfmData.transactions.findIndex(t => t.id === transactionId); if (index > -1) sfmData.transactions[index] = transactionData; } else { sfmData.transactions.push(transactionData); }
    saveSfmDataToLocalStorage(); renderTransactionList(); renderAnimalList(); closeSfmFormModal();
    showSfmAppNotification(transactionId ? "تم تحديث المعاملة." : "تم تسجيل المعاملة.", "success");
}
function renderTransactionList() {
    const tableBody = document.getElementById('transactionsTableBody'); const noMsg = document.getElementById('noTransactionsMessage'); if(!tableBody || !noMsg) return;
    const filterType = getStrVal('transactionFilterType');
    const filteredTransactions = sfmData.transactions.filter(t => (filterType === 'all' || t.type === filterType)).sort((a,b) => new Date(b.date) - new Date(a.date));
    if (filteredTransactions.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none';
    tableBody.innerHTML = filteredTransactions.map(t => `<tr><td>${sfmFormatDate(t.date)}</td><td>${getTransactionTypeText(t.type)}</td><td>${t.description}</td><td style="color:${t.type === 'sale' ? 'green' : (t.type === 'expense' || t.type === 'purchase' ? 'red' : 'inherit')}; font-weight:bold;">${sfmFormatCurrency(t.amount)}</td><td>${t.party || '-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openTransactionFormModal('${t.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('transactions', '${t.id}', renderTransactionList)">🗑️</button></td></tr>`).join('');
}
function getTransactionTypeText(type){ const types = {sale:'بيع', purchase:'شراء', expense:'مصروف'}; return types[type] || type; }

function generateSfmReport(reportType) {
    const outputArea = document.getElementById('reportOutputArea'); if(!outputArea) return;
    let reportHTML = `<div style="padding:10px;"><h4 style="color:#1877f2; border-bottom:1px solid #ddd; padding-bottom:5px;">تقرير: ${getReportName(reportType)} (${sfmFormatDate(new Date())})</h4>`;
    if (reportType === 'flockSummary') {
        reportHTML += `<p>إجمالي الحيوانات: ${sfmData.animals.length}</p><p>النعاج: ${sfmData.animals.filter(a=>a.sex==='female' && !isLamb(a.birthDate)).length} | الكباش: ${sfmData.animals.filter(a=>a.sex==='male' && !isLamb(a.birthDate)).length} | الحملان: ${sfmData.animals.filter(a=>isLamb(a.birthDate)).length}</p><h5>توزيع السلالات:</h5><ul>`;
        const breeds = {}; sfmData.animals.forEach(a => breeds[a.breed] = (breeds[a.breed] || 0) + 1);
        for(const breed in breeds) reportHTML += `<li>${breed}: ${breeds[breed]}</li>`; reportHTML += '</ul></div>';
    } else if (reportType === 'financialActuals') {
        const sales = sfmData.transactions.filter(t=>t.type === 'sale').reduce((sum,t)=> sum + t.amount, 0);
        const purchases = sfmData.transactions.filter(t=>t.type === 'purchase').reduce((sum,t)=> sum + t.amount, 0);
        const expenses = sfmData.transactions.filter(t=>t.type === 'expense').reduce((sum,t)=> sum + t.amount, 0);
        reportHTML += `<table id="detailedReportTable"><tr><td>إجمالي المبيعات:</td><td>${sfmFormatCurrency(sales)}</td></tr><tr><td>إجمالي المشتريات:</td><td>${sfmFormatCurrency(purchases)}</td></tr><tr><td>إجمالي المصروفات الأخرى:</td><td>${sfmFormatCurrency(expenses)}</td></tr><tr style="font-weight:bold;"><td>صافي التدفق النقدي:</td><td>${sfmFormatCurrency(sales - purchases - expenses)}</td></tr></table></div>`;
    } else { reportHTML += `<p class="alert-info">التقرير "${getReportName(reportType)}" قيد التطوير.</p></div>`; }
    outputArea.innerHTML = reportHTML;
}
function getReportName(type){ const names = {flockSummary: 'ملخص القطيع', breedingPerformance: 'أداء التناسل', healthSummary: 'ملخص صحي', feedConsumption:'استهلاك العلف', financialActuals:'الماليات الفعلية', inventoryStatus:'حالة المخزون', mortalityReport:'النفوق', cullingReport:'الاستبعاد', growthPerformance:'أداء النمو'}; return names[type] || type; }

function loadFarmSettingsToUI() { setSfmVal('farmNameSetting', sfmData.settings.farmName); setSfmVal('farmOwnerSetting', sfmData.settings.farmOwner); setSfmVal('defaultCurrencySetting', sfmData.settings.defaultCurrency); setSfmVal('customBreedsSetting', (sfmData.settings.customBreeds || []).join(', ')); setSfmVal('customFeedTypesSetting', (sfmData.settings.customFeedTypes || []).join(', ')); document.getElementById('sfmFarmNameTitle').textContent = `🐑 ${sfmData.settings.farmName || 'نظام إدارة مزرعة الأغنام'}`; }
function saveFarmSettings() { sfmData.settings.farmName = getSfmStrVal('farmNameSetting'); sfmData.settings.farmOwner = getSfmStrVal('farmOwnerSetting'); sfmData.settings.defaultCurrency = getSfmStrVal('defaultCurrencySetting') || 'ج.م'; saveSfmDataToLocalStorage(); showSfmAppNotification("تم حفظ الإعدادات.", "success"); document.getElementById('sfmFarmNameTitle').textContent = `🐑 ${sfmData.settings.farmName || 'نظام إدارة مزرعة الأغنام'}`; }
function saveCustomTypes() { sfmData.settings.customBreeds = getSfmStrVal('customBreedsSetting').split(',').map(s=>s.trim()).filter(Boolean); sfmData.settings.customFeedTypes = getSfmStrVal('customFeedTypesSetting').split(',').map(s=>s.trim()).filter(Boolean); saveSfmDataToLocalStorage(); showSfmAppNotification("تم حفظ الأنواع المخصصة.", "success"); populateAnimalFilterDropdowns(); populateFeedRationSelect(); }

function backupSfmData() { try { const dataStr = JSON.stringify(sfmData, null, 2); const blob = new Blob([dataStr], {type: 'application/json;charset=utf-8'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; const farmNameSafe = (sfmData.settings.farmName || "FarmData").replace(/[^a-z0-9\u0600-\u06FF]/gi, '_').toLowerCase(); const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,''); link.download = `sfm_backup_${farmNameSafe}_${timestamp}.json`; link.click(); URL.revokeObjectURL(link.href); showSfmAppNotification("تم إنشاء نسخة احتياطية!", "success"); } catch (e) { console.error("Backup error:", e); showSfmAppNotification("فشل إنشاء النسخة الاحتياطية.", "error"); } }
function restoreSfmData(event) {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const restoredData = JSON.parse(e.target.result);
            if (restoredData && restoredData.animals !== undefined && restoredData.settings !== undefined) {
                sfmData = {...createDefaultSfmData(), ...restoredData, settings: {...createDefaultSfmData().settings, ...(restoredData.settings || {})}}; // Merge with defaults
                saveSfmDataToLocalStorage(); showSfmAppNotification("تم استعادة البيانات! يتم تحديث الواجهة...", "success");
                setTimeout(() => { sfmIsInitialAppLoad = true; navigateToSfmSection('dashboard'); refreshAllSfmDataViews(); }, 500);
            } else { showSfmAppNotification("الملف غير صالح.", "error");}
        } catch (err) { console.error("Error restoring data:", err); showSfmAppNotification("فشل استعادة البيانات.", "error"); }
    };
    reader.readAsText(file, "UTF-8"); event.target.value = null;
}
function confirmClearAllData() { if (confirm("هل أنت متأكد من مسح جميع بيانات المزرعة؟ لا يمكن التراجع عن هذا!")) { sfmData = createDefaultSfmData(); saveSfmDataToLocalStorage(); showSfmAppNotification("تم مسح جميع البيانات.", "warn"); sfmIsInitialAppLoad = true; navigateToSfmSection('dashboard'); refreshAllSfmDataViews(); } }

function handleSfmFabClick(){
    switch(currentSfmSectionId){
        case 'animalManagement': openAnimalFormModal(null); break;
        case 'breedingManagement': openMatingFormModal(null); break;
        case 'healthManagement': openHealthRecordFormModal(null); break;
        case 'inventoryManagement': openInventoryItemFormModal(null); break;
        case 'taskManagement': openTaskFormModal(null); break;
        case 'salesPurchases': openTransactionFormModal(null, 'sale'); break;
        case 'feedingManagement': openFeedRationFormModal(null); break;
        default: showSfmAppNotification("اختر قسمًا لإضافة سجل جديد.", "info"); break;
    }
}
function deleteSfmItem(itemTypeKey, itemId, renderCallback) {
    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
        if(sfmData[itemTypeKey] && Array.isArray(sfmData[itemTypeKey])) {
            sfmData[itemTypeKey] = sfmData[itemTypeKey].filter(item => item.id !== itemId);
            saveSfmDataToLocalStorage();
            if(renderCallback && typeof renderCallback === 'function') renderCallback();
            renderDashboard(); 
            showSfmAppNotification("تم الحذف بنجاح.", "success");
        } else {
             showSfmAppNotification("نوع السجل غير معروف للحذف.", "error");
        }
    }
}

if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.font.size = 11; Chart.defaults.color = '#606770';
    Chart.defaults.plugins.legend.position = 'bottom'; Chart.defaults.plugins.tooltip.rtl = true;
    Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' }; Chart.defaults.plugins.title.display = true;
    Chart.defaults.plugins.title.color = '#050505'; Chart.defaults.plugins.title.font = { weight: '600', size: 14};
}
