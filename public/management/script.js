let currentSfmSectionId = 'dashboard';
let sfmTouchStartXCoord = 0;
let sfmTouchEndXCoord = 0;
let sfmTouchStartYCoord = 0;
let sfmTouchEndYCoord = 0; 
let sfmIsPullingToRefresh = false;
let sfmAppCharts = {}; 
let sfmIsInitialAppLoad = true;
let sfmIsLoading = false;
let sfmCurrentlyEditingId = null;

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
    equipment: [],
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
        defaultTaskStatus: "pending",
        photoUploadMaxSizeMB: 2,
        lowStockWarningPercentage: 20,
        defaultAnimalWeightUnit: "kg"
    }
};

// Helper functions for backward compatibility
function getSfmVal(id, isCheckbox = false, isSelect = false) { return getVal(id, isCheckbox, isSelect); }
function getSfmStrVal(id, required = false) { return getStrVal(id, required); }
function setSfmVal(id, value) { return setVal(id, value); }
function setSfmContent(id, content) { return setContent(id, content); }

function getVal(id, isCheckbox = false, isSelect = false) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`getVal: Element with ID '${id}' not found.`); return isCheckbox ? false : (isSelect ? '' : 0); }
    if (isCheckbox) return el.checked;
    if (isSelect) return el.value;
    const value = parseFloat(el.value);
    const minVal = el.hasAttribute('min') ? parseFloat(el.getAttribute('min')) : -Infinity;
    const maxVal = el.hasAttribute('max') ? parseFloat(el.getAttribute('max')) : Infinity;
    if (el.type === 'number' && value < minVal) { showSfmAppNotification(`القيمة لـ ${el.labels && el.labels[0] ? el.labels[0].innerText : id} يجب أن تكون ${minVal} على الأقل.`, 'warn'); el.value = minVal; return minVal; }
    if (el.type === 'number' && value > maxVal) { showSfmAppNotification(`القيمة لـ ${el.labels && el.labels[0] ? el.labels[0].innerText : id} يجب أن تكون ${maxVal} على الأكثر.`, 'warn'); el.value = maxVal; return maxVal; }
    return isNaN(value) ? 0 : value;
}
function getStrVal(id, required = false) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`getStrVal: Element with ID '${id}' not found.`); return ''; }
    const val = el.value.trim();
    if (required && !val) { showSfmAppNotification(`حقل "${el.labels && el.labels[0] && el.labels[0].innerText ? el.labels[0].innerText.replace(':','') : id}" مطلوب.`, 'error'); throw new Error("Required field missing: " + id); }
    return val;
}
function setVal(id, value) { const el = document.getElementById(id); if (el) el.value = (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) ? '' : value; }
function setContent(id, content) { const el = document.getElementById(id); if (el) el.innerHTML = (content === null || content === undefined) ? '' : content; }
function sfmFormatCurrency(num) { if (isNaN(parseFloat(num)) || num === null || num === undefined) return '0'; return new Intl.NumberFormat('ar-EG').format(Math.round(num)) + ' ' + (sfmData.settings.defaultCurrency || 'ج.م');}
function sfmFormatDate(dateStrOrDate, type = 'short') { if (!dateStrOrDate) return 'غير محدد'; try { const options = type === 'long' ? { year: 'numeric', month: 'long', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' }; return new Date(dateStrOrDate).toLocaleDateString('ar-EG', options); } catch (e) { return 'تاريخ غير صالح'; }}
function generateUUID() { return crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }

function showSfmAppNotification(message, type = 'success') {
    const existingNotif = document.querySelector('.app-notification'); if (existingNotif) existingNotif.remove();
    const notif = document.createElement('div'); notif.className = 'app-notification'; notif.textContent = message;
    notif.style.cssText = `position: fixed; top: calc(env(safe-area-inset-top) + 70px + 10px); left: 50%; transform: translateX(-50%) translateY(-40px); background: ${type === 'success' ? '#4CAF50' : (type === 'warn' ? '#FFC107' : '#F44336')}; color: white; padding: 10px 20px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px; font-weight: 500; z-index: 2000; opacity: 0; transition: opacity 0.25s ease-out, transform 0.25s ease-out; text-align: center; max-width: 90%;`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; notif.style.transform = 'translateX(-50%) translateY(0px)'; }, 10);
    setTimeout(() => { notif.style.opacity = '0'; notif.style.transform = 'translateX(-50%) translateY(-40px)'; setTimeout(() => notif.remove(), 300); }, type === 'error' ? 4000 : 2500);
}

function toggleSfmLoading(show) {
    sfmIsLoading = show; const fab = document.getElementById('sfmMainFab');
    if (fab) { if (show) { fab.innerHTML = '<div class="fab-spinner"></div>'; fab.disabled = true; } else { fab.innerHTML = '<span>➕</span>'; fab.disabled = false; } }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAppControls(); setupSfmGlobalEventListeners(); loadSfmDataFromLocalStorage();
    refreshAllSfmDataViews(); loadFarmSettingsToUI();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => { if (!input.value) { input.valueAsDate = new Date(); }});
    if (typeof Chart !== 'undefined') { Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif"; Chart.defaults.font.size = 11; Chart.defaults.color = '#606770'; Chart.defaults.plugins.legend.position = 'bottom'; Chart.defaults.plugins.tooltip.rtl = true; Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' }; Chart.defaults.plugins.title.display = true; Chart.defaults.plugins.title.color = '#050505'; Chart.defaults.plugins.title.font = { weight: '600', size: 14}; }
});

function initializeAppControls() {
    updateSfmActiveNavigation();
    document.querySelectorAll('#sfmsBottomNav .nav-item, #sfmsMenuSheet .btn, #sfmsMoreSheet .nav-item, .header-btn, .fab').forEach(element => {
        element.addEventListener('click', function() { this.classList.add('haptic-feedback'); setTimeout(() => this.classList.remove('haptic-feedback'), 150); });
    });
}
function setupSfmGlobalEventListeners() {
    const contentAreaEl = document.getElementById('sfmsContentArea'); if (!contentAreaEl) return;
    contentAreaEl.addEventListener('touchstart', handleSfmPageTouchStart, { passive: false });
    contentAreaEl.addEventListener('touchmove', handleSfmPageTouchMove, { passive: false });
    contentAreaEl.addEventListener('touchend', handleSfmPageTouchEnd);
}

function handleSfmPageTouchStart(e) { if (e.target.closest('.sheet-content') || e.target.closest('.chart-container canvas') || e.target.closest('.modal-content-sfms')) { sfmTouchStartXCoord = 0; return; } sfmTouchStartXCoord = e.touches[0].clientX; sfmTouchStartYCoord = e.touches[0].clientY; sfmTouchEndXCoord = e.touches[0].clientX; sfmTouchEndYCoord = e.touches[0].clientY; }
function handleSfmPageTouchMove(e) { if (!sfmTouchStartXCoord && !sfmTouchStartYCoord) return; sfmTouchEndXCoord = e.touches[0].clientX; sfmTouchEndYCoord = e.touches[0].clientY; const diffX = sfmTouchStartXCoord - sfmTouchEndXCoord; const diffY = sfmTouchStartYCoord - sfmTouchEndYCoord; const swipeLeftIndicator = document.getElementById('navSwipeLeft'); const swipeRightIndicator = document.getElementById('navSwipeRight'); if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 20) { if (e.cancelable) e.preventDefault(); if (diffX > 0) { if(swipeRightIndicator) swipeRightIndicator.classList.add('active'); if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); } else { if(swipeLeftIndicator) swipeLeftIndicator.classList.add('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); } } else { if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); } const contentAreaEl = document.getElementById('sfmsContentArea'); const pullToRefreshEl = document.getElementById('pagePullToRefresh'); if (contentAreaEl && pullToRefreshEl && contentAreaEl.scrollTop <= 5 && diffY < -60 && Math.abs(diffX) < Math.abs(diffY)) { if (e.cancelable) e.preventDefault(); sfmIsPullingToRefresh = true; pullToRefreshEl.classList.add('visible'); }}
function handleSfmPageTouchEnd() { const swipeLeftIndicator = document.getElementById('navSwipeLeft'); const swipeRightIndicator = document.getElementById('navSwipeRight'); if(swipeLeftIndicator) swipeLeftIndicator.classList.remove('active'); if(swipeRightIndicator) swipeRightIndicator.classList.remove('active'); if (!sfmTouchStartXCoord && !sfmTouchStartYCoord) return; const diffX = sfmTouchStartXCoord - sfmTouchEndXCoord; const diffY = sfmTouchStartYCoord - sfmTouchEndYCoord; const absDiffX = Math.abs(diffX); const absDiffY = Math.abs(diffY); if (absDiffX > 60 && absDiffX > absDiffY * 1.2) { const currentIndex = sfmAppSectionOrder.indexOf(currentSfmSectionId); if (diffX > 0 && currentIndex < sfmAppSectionOrder.length - 1) navigateToSfmSection(sfmAppSectionOrder[currentIndex + 1], 'left'); else if (diffX < 0 && currentIndex > 0) navigateToSfmSection(sfmAppSectionOrder[currentIndex - 1], 'right'); } const pullToRefreshEl = document.getElementById('pagePullToRefresh'); const contentAreaEl = document.getElementById('sfmsContentArea'); if (pullToRefreshEl && sfmIsPullingToRefresh && absDiffY > 70 && absDiffY > absDiffX && contentAreaEl && contentAreaEl.scrollTop <= 5 ) { pullToRefreshEl.classList.add('refreshing'); showSfmAppNotification("جاري تحديث البيانات...", "info"); setTimeout(() => { refreshAllSfmDataViews(); pullToRefreshEl.classList.remove('visible', 'refreshing'); sfmIsPullingToRefresh = false; }, 800); } else if (pullToRefreshEl) { pullToRefreshEl.classList.remove('visible'); sfmIsPullingToRefresh = false; } sfmTouchStartXCoord = 0; sfmTouchEndXCoord = 0; sfmTouchStartYCoord = 0; sfmTouchEndYCoord = 0; }

function navigateToSfmSection(sectionId, direction = null) {
    const oldSection = document.querySelector('#sfmsContentArea .section-page.active'); const newSection = document.getElementById(sectionId);
    if (!newSection) { console.error("SFM Target section not found:", sectionId); return; }
    if (oldSection && oldSection.id === sectionId && !sfmIsInitialAppLoad) return;
    document.querySelectorAll('#sfmsContentArea .section-page').forEach(s => s.classList.remove('active', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right')); newSection.style.transform = '';
    if (oldSection && oldSection.id !== sectionId) { oldSection.classList.remove('active'); if (direction === 'left') { oldSection.classList.add('slide-out-left'); newSection.style.transform = 'translateX(100%)'; } else if (direction === 'right') { oldSection.classList.add('slide-out-right'); newSection.style.transform = 'translateX(-100%)'; }}
    newSection.classList.add('active');
    if (direction) { void newSection.offsetWidth; if (direction === 'left') newSection.classList.add('slide-in-right'); else if (direction === 'right') newSection.classList.add('slide-in-left'); } else { newSection.style.transform = 'translateX(0)'; }
    setTimeout(() => { if(oldSection) oldSection.classList.remove('slide-out-left', 'slide-out-right'); newSection.classList.remove('slide-in-left', 'slide-in-right'); if (direction) newSection.style.transform = ''; }, 350);
    currentSfmSectionId = sectionId; updateSfmActiveNavigation();
    const contentArea = document.getElementById('sfmsContentArea'); if(contentArea) contentArea.scrollTop = 0;
    refreshCurrentSectionData(); sfmIsInitialAppLoad = false;
}
function showSfmSection(sectionId, direction = null) { const oldSectionEl = document.querySelector('#sfmsContentArea .section-page.active'); if (oldSectionEl && oldSectionEl.id === sectionId && !direction && !sfmIsInitialAppLoad) return; navigateToSfmSection(sectionId, direction); }

function updateSfmActiveNavigation() { document.querySelectorAll('#sfmsBottomNav .nav-item').forEach(item => item.classList.remove('active')); const mainSectionsForNav = ['dashboard', 'animalManagement', 'breedingManagement', 'healthManagement']; const activeNavIndex = mainSectionsForNav.indexOf(currentSfmSectionId); const moreNavBtn = document.getElementById('sfmsMoreNavBtn'); if (activeNavIndex !== -1) { document.querySelectorAll('#sfmsBottomNav .nav-item')[activeNavIndex].classList.add('active'); if(moreNavBtn) moreNavBtn.classList.remove('active'); } else { if(moreNavBtn) moreNavBtn.classList.add('active'); }}

function showSfmBottomSheet(type) { const sheetId = type === 'sfmsMenuSheet' ? 'sfmsMenuSheet' : 'sfmsMoreSheet'; const sheetEl = document.getElementById(sheetId); const overlayEl = document.getElementById('sfmsPageOverlay'); if (sheetEl && overlayEl) { sheetEl.classList.add('active'); overlayEl.classList.add('active'); }}
function hideSfmBottomSheet(type) { const sheetId = type === 'sfmsMenuSheet' ? 'sfmsMenuSheet' : 'sfmsMoreSheet'; const sheetEl = document.getElementById(sheetId); if (sheetEl) sheetEl.classList.remove('active'); const anySheetActive = Array.from(document.querySelectorAll('.bottom-sheet')).some(s => s.classList.contains('active')); if (!anySheetActive) { const overlayEl = document.getElementById('sfmsPageOverlay'); if(overlayEl) overlayEl.classList.remove('active'); }}
function hideAllSfmSheets() { document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('active')); const overlayEl = document.getElementById('sfmsPageOverlay'); if(overlayEl) overlayEl.classList.remove('active'); closeSfmFormModal(); }

function refreshCurrentSectionData() {
    switch (currentSfmSectionId) {
        case 'dashboard': renderDashboard(); break;
        case 'animalManagement': renderAnimalList(); populateAnimalFilterDropdowns(); break;
        case 'breedingManagement': renderMatingRecords(); renderLambingRecords(); renderWeaningRecords(); break;
        case 'healthManagement': renderHealthRecords(); break;
        case 'feedingManagement': populateFeedRationSelect(); displaySelectedRation(); renderWaterLog(); break;
        case 'inventoryManagement': renderInventoryList(); break;
        case 'taskManagement': renderTaskList(); break;
        case 'salesPurchases': renderTransactionList(); break;
        case 'reports': setContent('reportOutputArea', '<p class="list-empty-message" style="padding:20px;">اختر تقريراً لعرضه.</p>'); break;
        case 'settings': loadFarmSettingsToUI(); renderEquipmentList(); break;
    }
}
function refreshAllSfmDataViews(){ renderDashboard(); renderAnimalList(); populateAnimalFilterDropdowns(); renderMatingRecords(); renderLambingRecords(); renderWeaningRecords(); renderHealthRecords(); populateFeedRationSelect(); displaySelectedRation(); renderWaterLog(); renderInventoryList(); renderTaskList(); renderTransactionList(); loadFarmSettingsToUI(); renderEquipmentList(); }

const SFM_DATA_KEY = 'sheepFarmManagementSystemData_v4';
function saveSfmDataToLocalStorage() { try { localStorage.setItem(SFM_DATA_KEY, JSON.stringify(sfmData)); } catch(e) { console.error("Error saving to localStorage:", e); showSfmAppNotification("خطأ: لم يتم حفظ البيانات. قد تكون مساحة التخزين ممتلئة أو البيانات كبيرة جداً (خاصة الصور).", "error"); } }
function loadSfmDataFromLocalStorage() {
    const dataStr = localStorage.getItem(SFM_DATA_KEY); const defaults = createDefaultSfmData();
    if (dataStr) { try { const loaded = JSON.parse(dataStr); sfmData = {...defaults, ...loaded, settings: {...defaults.settings, ...(loaded.settings || {})}}; } catch(e) { console.error("Error parsing data from localStorage:", e); sfmData = defaults; } } else { sfmData = defaults; }
    Object.keys(defaults).forEach(key => { if(sfmData[key] === undefined) sfmData[key] = defaults[key]; if(Array.isArray(defaults[key]) && !Array.isArray(sfmData[key])) sfmData[key] = defaults[key]; });
    if(!Array.isArray(sfmData.settings.customBreeds) || sfmData.settings.customBreeds.length === 0) sfmData.settings.customBreeds = defaults.settings.customBreeds;
    if(!Array.isArray(sfmData.settings.customFeedTypes) || sfmData.settings.customFeedTypes.length === 0) sfmData.settings.customFeedTypes = defaults.settings.customFeedTypes;
    if(!Array.isArray(sfmData.equipment)) sfmData.equipment = [];
}
function createDefaultSfmData(){ return { animals: [], matings: [], lambings: [], weanings: [], healthRecords: [], feedRations: [], feedConsumptionLog:[], waterLog:[], inventory: [], equipment:[], tasks: [], transactions: [], settings: { farmName: "مزرعتي النموذجية", farmOwner: "اسم المالك", defaultCurrency: "ج.م", customBreeds: ["بلدي", "رحماني", "عسافي", "برقي"], customFeedTypes: ["علف تسمين", "علف حلاب", "ذرة", "شعير"], photoUploadMaxSizeMB: 2, lowStockWarningPercentage:20, defaultAnimalStatus: "active", defaultTaskPriority: "medium", defaultTaskStatus: "pending" }};}

function openSfmFormModal(title, formHTML, onSubmitCallbackName, entityId = null, modalSize = 'medium') {
    setContent('formModalTitle', title); const modalBody = document.getElementById('formModalBody'); const modalContent = document.getElementById('formModalContainer');
    sfmCurrentlyEditingId = entityId;
    if (modalBody && modalContent) {
        modalBody.innerHTML = formHTML + `<div class="modal-footer-sfms"><button class="btn btn-primary" onclick="${onSubmitCallbackName}()">حفظ</button><button class="btn btn-secondary" onclick="closeSfmFormModal()">إلغاء</button></div>`;
        modalContent.className = 'modal-content-sfms'; if(modalSize === 'large') modalContent.classList.add('modal-large'); else if(modalSize === 'small') modalContent.classList.add('modal-small');
    }
    const overlay = document.getElementById('formModalOverlay'); if (overlay) overlay.classList.add('active');
}
function closeSfmFormModal() { const overlay = document.getElementById('formModalOverlay'); if(overlay) overlay.classList.remove('active'); setContent('formModalBody', ''); sfmCurrentlyEditingId = null;}

function renderDashboard() {
    const statsContainer = document.getElementById('dashboardStats'); const tasksContainer = document.getElementById('dashboardTasks'); const noTasksMsg = document.getElementById('noDashboardTasksMessage');
    if (!statsContainer || !tasksContainer || !noTasksMsg) return;
    const totalAnimals = sfmData.animals.length; const ewesCount = sfmData.animals.filter(a => a.sex === 'female' && !isAnimalLamb(a.birthDate)).length;
    const ramsCount = sfmData.animals.filter(a => a.sex === 'male' && !isAnimalLamb(a.birthDate)).length; const lambsCount = sfmData.animals.filter(a => isAnimalLamb(a.birthDate)).length;
    const now = new Date(); const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const upcomingHealth = sfmData.healthRecords.filter(hr => hr.nextDueDate && new Date(hr.nextDueDate) >= now && new Date(hr.nextDueDate) <= oneWeekFromNow).length;
    const lowFeed = sfmData.inventory.filter(item => item.type === 'feed' && item.reorderLevel > 0 && item.currentStock < item.reorderLevel).length;
    const upcomingLambingCount = sfmData.matings.filter(m => m.status === 'pregnant' && m.expectedDueDate && new Date(m.expectedDueDate) >= now && new Date(m.expectedDueDate) <= oneMonthFromNow).length;
    let adgTotal = 0; let adgCount = 0;
    sfmData.animals.forEach(animal => { if (animal.weightHistory && animal.weightHistory.length >= 2) { const sortedWeights = [...animal.weightHistory].sort((a,b) => new Date(a.date) - new Date(b.date)); for(let j=1; j < sortedWeights.length; j++){ const first = sortedWeights[j-1]; const last = sortedWeights[j]; const days = (new Date(last.date) - new Date(first.date)) / (1000*60*60*24); if (days > 0 && last.weight > first.weight) { adgTotal += (last.weight - first.weight) / days; adgCount++; }}}});
    const avgDailyGain = adgCount > 0 ? (adgTotal / adgCount * 1000).toFixed(0) : 0;
    statsContainer.innerHTML = `<div class="stat-card" onclick="showSfmSection('animalManagement')"><div class="stat-value">${totalAnimals}</div><div class="stat-label">إجمالي الحيوانات</div></div><div class="stat-card" onclick="showSfmSection('animalManagement'); filterAnimalListBySex('female');"><div class="stat-value">${ewesCount}</div><div class="stat-label">النعاج</div></div><div class="stat-card" onclick="showSfmSection('animalManagement'); filterAnimalListBySex('male');"><div class="stat-value">${ramsCount}</div><div class="stat-label">الكباش</div></div><div class="stat-card" onclick="showSfmSection('animalManagement'); filterAnimalListByAge('lamb');"><div class="stat-value">${lambsCount}</div><div class="stat-label">الحملان</div></div><div class="stat-card ${upcomingHealth > 0 ? 'alert-card' : ''}" id="dashHealthAlertsCard" onclick="showSfmSection('healthManagement'); filterHealthByUpcoming();"><div class="stat-value" id="dashHealthAlerts">${upcomingHealth}</div><div class="stat-label">تنبيهات صحية</div></div><div class="stat-card ${lowFeed > 0 ? 'alert-card' : ''}" id="dashFeedStockLowCard" onclick="showSfmSection('inventoryManagement'); filterInventoryByLowStock();"><div class="stat-value" id="dashFeedStockLow">${lowFeed}</div><div class="stat-label">نقص مخزون علف</div></div><div class="stat-card" onclick="showSfmSection('breedingManagement'); filterMatingsByPregnant();"><div class="stat-value" id="dashUpcomingLambings">${upcomingLambingCount}</div><div class="stat-label">ولادات قريبة</div></div><div class="stat-card"><div class="stat-value" id="dashAvgDailyGain">${avgDailyGain} جم</div><div class="stat-label">م. نمو يومي</div></div>`;
    const upcomingTasks = sfmData.tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) >= now).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);
    if (upcomingTasks.length > 0) { tasksContainer.innerHTML = upcomingTasks.map(task => `<li style="border-right: 4px solid ${task.priority === 'high' ? '#e74c3c' : task.priority === 'medium' ? '#f39c12' : '#27ae60'};" onclick="openTaskFormModal('${task.id}')"><span class="task-title">${task.title}</span><span class="task-due">${sfmFormatDate(task.dueDate)}</span></li>`).join(''); noTasksMsg.style.display = 'none'; } else { tasksContainer.innerHTML = ''; noTasksMsg.style.display = 'block'; }
    createDashboardCharts();
}
function isAnimalLamb(birthDateStr, monthsThreshold = 6) { if (!birthDateStr) return true; const birthDate = new Date(birthDateStr); const ageInMilliseconds = new Date() - birthDate; const ageInMonths = ageInMilliseconds / (1000 * 60 * 60 * 24 * 30.4375); return ageInMonths < monthsThreshold && ageInMonths >= 0; }

// Destroy chart helper function
function destroyChart(chartName) {
    if (sfmAppCharts[chartName]) {
        sfmAppCharts[chartName].destroy();
        delete sfmAppCharts[chartName];
    }
}

function createDashboardCharts() {
    destroyChart('dashboardPerformance'); const perfCtx = document.getElementById('dashboardPerformanceChart')?.getContext('2d');
    if (perfCtx) {
        const totalAnimalsEver = sfmData.animals.length > 0 ? sfmData.animals.length : 1; // Avoid division by zero
        const culledDead = sfmData.animals.filter(a => a.status === 'culled_dead').length;
        const mortalityRate = (culledDead / totalAnimalsEver) * 100;
        const totalEwesOldEnough = sfmData.animals.filter(a=>a.sex==='female' && !isAnimalLamb(a.birthDate, 12)).length || 1;
        const totalLambsBornEver = sfmData.lambings.reduce((sum, l)=> sum + (l.lambsBorn ||0) ,0);
        const lambingRate = (totalLambsBornEver / totalEwesOldEnough * 100);
        sfmAppCharts.dashboardPerformance = new Chart(perfCtx, { type: 'bar', data: { labels: ['معدل النفوق (%)', 'نسبة الولادة للنعاج (%)'], datasets: [{ label: 'أداء', data: [mortalityRate.toFixed(1), lambingRate.toFixed(1)], backgroundColor: ['#fa383e', '#5cb85c'] }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales:{x:{beginAtZero:true, suggestedMax:120}}, plugins:{title:{display:true, text:'مؤشرات أداء رئيسية'}}} });
    }
    destroyChart('dashboardBreeding'); const breedCtx = document.getElementById('dashboardBreedingChart')?.getContext('2d');
    if (breedCtx) {
        const pregnantCount = sfmData.matings.filter(m => m.status === 'pregnant').length;
        const openEwes = sfmData.animals.filter(a => a.sex === 'female' && !isAnimalLamb(a.birthDate) && a.status === 'active' && !sfmData.matings.find(m => m.eweId === a.id && (m.status === 'pregnant' || m.status === 'mated'))).length;
        const matedNotConfirmed = sfmData.matings.filter(m=> m.status === 'mated').length;
        sfmAppCharts.dashboardBreeding = new Chart(breedCtx, { type: 'doughnut', data: { labels: ['نعاج عشار', 'نعاج فارغة (متاحة)', 'تم تلقيحها'], datasets: [{ data: [pregnantCount, openEwes, matedNotConfirmed], backgroundColor: ['#4CAF50', '#FFC107', '#2196F3'], borderColor: '#fff', borderWidth: 2}]}, options: { responsive: true, maintainAspectRatio: false, plugins:{title:{display:true, text:'حالة التناسل للنعاج البالغة'}} } });
    }
}
function filterAnimalListBySex(sex) { const el = document.getElementById('animalFilterSex'); if(el) el.value = sex; renderAnimalList(); }
function filterAnimalListByAge(ageGroup) { 
    const filterStatus = document.getElementById('animalFilterStatus');
    if (filterStatus) {
        // Reset other filters
        document.getElementById('animalFilterBreed').value = '';
        document.getElementById('animalFilterSex').value = '';
        filterStatus.value = '';
    }
    // Filter by age group
    const tableBody = document.getElementById('animalListTableBody');
    if (tableBody) {
        const animals = sfmData.animals.filter(a => ageGroup === 'lamb' ? isAnimalLamb(a.birthDate) : !isAnimalLamb(a.birthDate));
        if (animals.length === 0) {
            tableBody.innerHTML = '';
            document.getElementById('noAnimalsMessage').style.display = 'block';
        } else {
            renderAnimalList();
        }
    }
}
function filterHealthByUpcoming() { 
    showSfmSection('healthManagement');
    // Filter health records to show only upcoming ones
    const searchInput = document.getElementById('healthSearchInput');
    if (searchInput) searchInput.value = '';
    const now = new Date();
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRecords = sfmData.healthRecords.filter(hr => 
        hr.nextDueDate && new Date(hr.nextDueDate) >= now && new Date(hr.nextDueDate) <= oneWeekFromNow
    );
    
    const tableBody = document.getElementById('healthRecordsTableBody');
    const noMsg = document.getElementById('noHealthRecordsMessage');
    if (tableBody && noMsg) {
        if (upcomingRecords.length === 0) {
            tableBody.innerHTML = '';
            noMsg.style.display = 'block';
            noMsg.textContent = 'لا توجد سجلات صحية قادمة خلال الأسبوع القادم.';
        } else {
            renderHealthRecords();
        }
    }
}
function filterInventoryByLowStock() { 
    showSfmSection('inventoryManagement');
    // Filter to show only low stock items
    const filterType = document.getElementById('inventoryFilterType');
    if (filterType) filterType.value = '';
    const searchInput = document.getElementById('inventorySearchInput');
    if (searchInput) searchInput.value = 'low-stock-filter';
    
    const lowStockItems = sfmData.inventory.filter(item => 
        item.reorderLevel > 0 && item.currentStock < item.reorderLevel
    );
    
    const tableBody = document.getElementById('inventoryTableBody');
    const noMsg = document.getElementById('noInventoryMessage');
    if (tableBody && noMsg && lowStockItems.length === 0) {
        tableBody.innerHTML = '';
        noMsg.style.display = 'block';
        noMsg.textContent = 'لا توجد عناصر بمخزون منخفض.';
    } else {
        renderInventoryList();
    }
    if (searchInput) searchInput.value = '';
}
function filterMatingsByPregnant() { 
    showSfmSection('breedingManagement');
    // Highlight pregnant ewes in the mating records
    setTimeout(() => {
        const pregnantMatings = sfmData.matings.filter(m => m.status === 'pregnant');
        const tableRows = document.querySelectorAll('#matingRecordsTableBody tr');
        tableRows.forEach(row => {
            const cells = row.cells;
            if (cells[4] && cells[4].textContent.includes('عشار')) {
                row.style.backgroundColor = '#e8f5e9';
                row.style.fontWeight = 'bold';
            }
        });
        if (pregnantMatings.length > 0) {
            showSfmAppNotification(`يوجد ${pregnantMatings.length} نعجة عشار (مظللة بالأخضر)`, "info");
        }
    }, 100);
}

function openAnimalFormModal(animalId = null) {
    sfmCurrentlyEditingId = animalId; const animal = animalId ? sfmData.animals.find(a => a.id === animalId) : {}; const title = animalId ? "تعديل بيانات حيوان" : "إضافة حيوان جديد";
    const breeds = [...new Set(sfmData.settings.customBreeds || [])]; const breedsOptions = breeds.map(b => `<option value="${b}" ${animal.breed === b ? 'selected' : ''}>${b}</option>`).join('');
    const formHTML = `<div class="input-field"><label for="animalFormTagId">الرقم التعريفي:</label><input type="text" id="animalFormTagId" value="${animal.tagId || ''}" required></div><div class="input-field"><label for="animalFormName">الاسم:</label><input type="text" id="animalFormName" value="${animal.name || ''}"></div><div class="input-field"><label for="animalFormPhoto">صورة الحيوان:</label><input type="file" id="animalFormPhoto" accept="image/*" onchange="previewAnimalPhoto(event)"><img id="animalPhotoPreview" src="${animal.photoDataUrl || '#'}" alt="معاينة الصورة" style="max-width:100px; max-height:100px; margin-top:5px; display:${animal.photoDataUrl ? 'block':'none'}; border-radius:4px; border: 1px solid #ddd;"/></div><div class="input-grid"><div class="input-field"><label for="animalFormBreed">السلالة:</label><select id="animalFormBreed"><option value="">-- اختر --</option>${breedsOptions}</select></div><div class="input-field"><label for="animalFormSex">الجنس:</label><select id="animalFormSex"><option value="male" ${animal.sex === 'male' ? 'selected' : ''}>ذكر</option><option value="female" ${animal.sex === 'female' ? 'selected' : ''}>أنثى</option></select></div></div><div class="input-grid"><div class="input-field"><label for="animalFormBirthDate">تاريخ الميلاد:</label><input type="date" id="animalFormBirthDate" value="${animal.birthDate || new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="animalFormInitialWeight">الوزن عند التسجيل (كجم):</label><input type="number" id="animalFormInitialWeight" value="${(animal.weightHistory && animal.weightHistory.length > 0 && (animal.weightHistory[0].type === 'birth' || animal.weightHistory[0].type === 'initial')) ? animal.weightHistory[0].weight : ''}" step="0.1" inputmode="decimal"></div></div><div class="input-grid"><div class="input-field"><label for="animalFormSireId">الأب (ID/Tag):</label><input type="text" id="animalFormSireId" value="${animal.sireId || ''}"></div><div class="input-field"><label for="animalFormDamId">الأم (ID/Tag):</label><input type="text" id="animalFormDamId" value="${animal.damId || ''}"></div></div><div class="input-grid"><div class="input-field"><label for="animalFormPurchaseDate">تاريخ الشراء:</label><input type="date" id="animalFormPurchaseDate" value="${animal.purchaseDate || ''}"></div><div class="input-field"><label for="animalFormPurchasePrice">سعر الشراء:</label><input type="number" id="animalFormPurchasePrice" value="${animal.purchasePrice || 0}" inputmode="numeric"></div></div><div class="input-field"><label for="animalFormStatus">الحالة:</label><select id="animalFormStatus"><option value="active" ${animal.status === 'active' || !animalId ? 'selected' : ''}>نشط</option><option value="sold" ${animal.status === 'sold' ? 'selected' : ''}>مباع</option><option value="culled_dead" ${animal.status === 'culled_dead' ? 'selected' : ''}>مستبعد/نافق</option><option value="quarantined" ${animal.status === 'quarantined' ? 'selected' : ''}>في الحجر</option></select></div><div class="input-field"><label for="animalFormNotes">ملاحظات:</label><textarea id="animalFormNotes" rows="2">${animal.notes || ''}</textarea></div>`;
    openSfmFormModal(title, formHTML, 'saveAnimal', null, 'large');
    if(animal.breed) { const breedSelect = document.getElementById('animalFormBreed'); if(breedSelect) breedSelect.value = animal.breed; }
}
function previewAnimalPhoto(event) { const reader = new FileReader(); const output = document.getElementById('animalPhotoPreview'); const file = event.target.files[0]; if(file && file.size > (sfmData.settings.photoUploadMaxSizeMB || 2) * 1024 * 1024){ showSfmAppNotification(`حجم الصورة يتجاوز الحد (${sfmData.settings.photoUploadMaxSizeMB || 2}MB).`, "error"); event.target.value = ""; output.src='#'; output.style.display='none'; return; } reader.onload = function(){ output.src = reader.result; output.style.display = 'block'; }; if(file) reader.readAsDataURL(file); else {output.src='#'; output.style.display='none';}}
async function saveAnimal() {
    const animalId = sfmCurrentlyEditingId;
    try {
        const tagId = getSfmStrVal('animalFormTagId', true);
        const existingAnimalByTag = sfmData.animals.find(a => a.tagId === tagId && a.id !== animalId);
        if (existingAnimalByTag) { showSfmAppNotification("الرقم التعريفي مستخدم بالفعل.", "error"); return; }
        let photoDataUrl = animalId ? sfmData.animals.find(a=>a.id===animalId)?.photoDataUrl : null;
        const photoFile = document.getElementById('animalFormPhoto').files[0];
        if (photoFile) { if (photoFile.size > (sfmData.settings.photoUploadMaxSizeMB || 2) * 1024 * 1024) { showSfmAppNotification(`حجم الصورة كبير (الحد ${sfmData.settings.photoUploadMaxSizeMB || 2} ميجا).`, "error"); return; } try { photoDataUrl = await readFileAsDataURL(photoFile); } catch (e) { showSfmAppNotification("خطأ تحميل الصورة.", "error"); }}
        const animalData = { id: animalId || generateUUID(), tagId, name: getSfmStrVal('animalFormName'), photoDataUrl, breed: getSfmStrVal('animalFormBreed'), sex: getSfmStrVal('animalFormSex'), birthDate: getStrVal('animalFormBirthDate'), sireId: getSfmStrVal('animalFormSireId'), damId: getSfmStrVal('animalFormDamId'), purchaseDate: getStrVal('animalFormPurchaseDate') || null, purchasePrice: getSfmVal('animalFormPurchasePrice'), status: getSfmStrVal('animalFormStatus'), notes: getSfmStrVal('animalFormNotes'), weightHistory: animalId ? (sfmData.animals.find(a=>a.id===animalId)?.weightHistory || []) : [], movementLog: animalId ? (sfmData.animals.find(a=>a.id===animalId)?.movementLog || []) : [], };
        const initialWeight = getSfmVal('animalFormInitialWeight');
        if (initialWeight > 0) { const weightDate = animalData.birthDate || new Date().toISOString().split('T')[0]; const weightType = animalData.birthDate && animalData.birthDate === weightDate ? 'birth':'initial'; if (!animalData.weightHistory.find(wh => wh.date === weightDate && wh.type === weightType)) { animalData.weightHistory.push({date: weightDate, weight: initialWeight, type: weightType }); animalData.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date)); }}
        if (animalId) { const index = sfmData.animals.findIndex(a => a.id === animalId); if (index > -1) sfmData.animals[index] = animalData; } else { sfmData.animals.push(animalData); }
        saveSfmDataToLocalStorage(); renderAnimalList(); closeSfmFormModal(); renderDashboard(); showSfmAppNotification(animalId ? "تم تحديث بيانات الحيوان." : "تم إضافة الحيوان.", "success");
    } catch (e) { console.error("Error saving animal:", e); }
}
function readFileAsDataURL(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }

function renderAnimalList() {
    const tableBody = document.getElementById('animalListTableBody'); const noAnimalsMsg = document.getElementById('noAnimalsMessage'); if (!tableBody || !noAnimalsMsg) return;
    const searchTerm = getStrVal('animalSearchInput').toLowerCase(); const filterBreed = getStrVal('animalFilterBreed'); const filterSex = getStrVal('animalFilterSex'); const filterStatus = getStrVal('animalFilterStatus'); const sortBy = getStrVal('animalSortBy');
    let filteredAnimals = sfmData.animals.filter(animal => (animal.tagId.toLowerCase().includes(searchTerm) || (animal.name && animal.name.toLowerCase().includes(searchTerm)) || animal.breed.toLowerCase().includes(searchTerm)) && (!filterBreed || animal.breed === filterBreed) && (!filterSex || animal.sex === filterSex) && (!filterStatus || animal.status === filterStatus));
    filteredAnimals.sort((a, b) => { if (sortBy === 'birthDate') return new Date(b.birthDate) - new Date(a.birthDate); if (sortBy === 'breed') return a.breed.localeCompare(b.breed, 'ar'); return a.tagId.localeCompare(b.tagId, 'ar', {numeric: true}); });
    if (filteredAnimals.length === 0) { tableBody.innerHTML = ''; noAnimalsMsg.style.display = 'block'; return; } noAnimalsMsg.style.display = 'none';
    tableBody.innerHTML = filteredAnimals.map(animal => `<tr><td><input type="checkbox" class="animal-select-checkbox" data-animal-id="${animal.id}" onchange="updateBatchActionsBarVisibility()"></td><td>${animal.tagId} ${animal.name ? `(<small>${animal.name}</small>)`:''}</td><td><img src="${animal.photoDataUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="صورة" class="animal-thumbnail" onerror="this.style.display='none';"></td><td>${animal.breed}</td><td>${animal.sex === 'male' ? 'ذكر' : 'أنثى'}</td><td>${calculateAge(animal.birthDate)}</td><td class="status-${animal.status}">${getAnimalStatusText(animal.status)}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openAnimalFormModal('${animal.id}')" title="تعديل">✏️</button><button class="btn btn-sm btn-info" onclick="openWeightLogFormModal('${animal.id}')" title="تسجيل وزن">⚖️</button><button class="btn btn-sm btn-secondary" onclick="openMovementLogFormModal('${animal.id}')" title="تسجيل حركة" style="background-color:#6f42c1;color:white;">↔️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('animals', '${animal.id}', renderAnimalList)" title="حذف">🗑️</button></td></tr>`).join('');
    populateAnimalFilterDropdowns(); updateBatchActionsBarVisibility();
}
function filterAnimalList() { renderAnimalList(); } function sortAndRenderAnimalList() { renderAnimalList(); }
function toggleSelectAllAnimals(checked) { document.querySelectorAll('.animal-select-checkbox').forEach(cb => cb.checked = checked); updateBatchActionsBarVisibility(); }
function updateBatchActionsBarVisibility() { const selectedCount = document.querySelectorAll('.animal-select-checkbox:checked').length; const bar = document.getElementById('animalBatchActionsBar'); if(bar) bar.style.display = selectedCount > 0 ? 'flex' : 'none'; }
function handleAnimalBatchAction(action) { 
    const selectedAnimalIds = Array.from(document.querySelectorAll('.animal-select-checkbox:checked')).map(cb => cb.dataset.animalId); 
    if (selectedAnimalIds.length === 0) { 
        showSfmAppNotification("يرجى تحديد حيوان واحد على الأقل.", "warn"); 
        return; 
    }
    
    switch(action) {
        case 'vaccinate':
            openBatchHealthRecordModal(selectedAnimalIds, 'vaccination');
            break;
        case 'treat':
            openBatchHealthRecordModal(selectedAnimalIds, 'treatment');
            break;
        case 'moveGroup':
            openBatchMovementModal(selectedAnimalIds);
            break;
        case 'sellGroup':
            if (confirm(`هل أنت متأكد من بيع ${selectedAnimalIds.length} حيوان؟`)) {
                selectedAnimalIds.forEach(id => {
                    const animal = sfmData.animals.find(a => a.id === id);
                    if (animal) animal.status = 'sold';
                });
                saveSfmDataToLocalStorage();
                renderAnimalList();
                renderDashboard();
                showSfmAppNotification(`تم تسجيل بيع ${selectedAnimalIds.length} حيوان.`, "success");
                // Uncheck all
                document.querySelectorAll('.animal-select-checkbox').forEach(cb => cb.checked = false);
                updateBatchActionsBarVisibility();
            }
            break;
        default:
            showSfmAppNotification(`عملية "${action}" قيد التنفيذ.`, "info");
    }
}

// Batch operation helper functions
function openBatchHealthRecordModal(animalIds, recordType) {
    const title = recordType === 'vaccination' ? "تحصين جماعي" : "علاج جماعي";
    const formHTML = `<h4>${title} لـ ${animalIds.length} حيوان</h4>
        <div class="input-field"><label for="batchHealthDate">التاريخ:</label><input type="date" id="batchHealthDate" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="input-field"><label for="batchHealthCondition">التشخيص/التحصين:</label><input type="text" id="batchHealthCondition" required></div>
        <div class="input-field"><label for="batchHealthMedication">الدواء:</label><input type="text" id="batchHealthMedication"></div>
        <div class="input-field"><label for="batchHealthDosage">الجرعة:</label><input type="text" id="batchHealthDosage"></div>
        <div class="input-field"><label for="batchHealthWithdrawal">فترة السحب (أيام):</label><input type="number" id="batchHealthWithdrawal" value="0" min="0"></div>
        <div class="input-field"><label for="batchHealthNextDue">المتابعة/الجرعة التالية:</label><input type="date" id="batchHealthNextDue"></div>
        <div class="input-field"><label for="batchHealthNotes">ملاحظات:</label><textarea id="batchHealthNotes" rows="2"></textarea></div>`;
    
    openSfmFormModal(title, formHTML, () => saveBatchHealthRecords(animalIds, recordType));
}

function saveBatchHealthRecords(animalIds, recordType) {
    try {
        const date = getStrVal('batchHealthDate', true);
        const condition = getStrVal('batchHealthCondition', true);
        const medication = getStrVal('batchHealthMedication');
        const dosage = getStrVal('batchHealthDosage');
        const withdrawalPeriod = getVal('batchHealthWithdrawal');
        const nextDueDate = getStrVal('batchHealthNextDue') || null;
        const notes = getStrVal('batchHealthNotes');
        
        animalIds.forEach(animalId => {
            const healthData = {
                id: generateUUID(),
                animalId: animalId,
                date: date,
                type: recordType,
                condition: condition,
                medication: medication,
                dosage: dosage,
                withdrawalPeriod: withdrawalPeriod,
                nextDueDate: nextDueDate,
                notes: notes
            };
            sfmData.healthRecords.push(healthData);
        });
        
        saveSfmDataToLocalStorage();
        renderHealthRecords();
        closeSfmFormModal();
        renderDashboard();
        showSfmAppNotification(`تم تسجيل ${recordType === 'vaccination' ? 'التحصين' : 'العلاج'} لـ ${animalIds.length} حيوان.`, "success");
        
        // Uncheck all
        document.querySelectorAll('.animal-select-checkbox').forEach(cb => cb.checked = false);
        updateBatchActionsBarVisibility();
    } catch(e) {
        showSfmAppNotification("خطأ في حفظ السجلات الصحية.", "error");
    }
}

function openBatchMovementModal(animalIds) {
    const formHTML = `<h4>نقل جماعي لـ ${animalIds.length} حيوان</h4>
        <div class="input-field"><label for="batchMovementDate">تاريخ النقل:</label><input type="date" id="batchMovementDate" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="input-field"><label for="batchMovementFrom">من (مجموعة/حظيرة):</label><input type="text" id="batchMovementFrom" placeholder="اتركه فارغاً إذا كانت من مواقع مختلفة"></div>
        <div class="input-field"><label for="batchMovementTo">إلى (مجموعة/حظيرة):</label><input type="text" id="batchMovementTo" required></div>
        <div class="input-field"><label for="batchMovementReason">السبب:</label><input type="text" id="batchMovementReason"></div>`;
    
    openSfmFormModal("نقل جماعي", formHTML, () => saveBatchMovement(animalIds));
}

function saveBatchMovement(animalIds) {
    try {
        const date = getStrVal('batchMovementDate', true);
        const from = getStrVal('batchMovementFrom');
        const to = getStrVal('batchMovementTo', true);
        const reason = getStrVal('batchMovementReason');
        
        animalIds.forEach(animalId => {
            const animal = sfmData.animals.find(a => a.id === animalId);
            if (animal) {
                const movementData = {
                    date: date,
                    from: from || animal.currentLocation || '',
                    to: to,
                    reason: reason
                };
                if (!animal.movementLog) animal.movementLog = [];
                animal.movementLog.push(movementData);
                animal.currentLocation = to;
            }
        });
        
        saveSfmDataToLocalStorage();
        renderAnimalList();
        closeSfmFormModal();
        showSfmAppNotification(`تم نقل ${animalIds.length} حيوان إلى ${to}.`, "success");
        
        // Uncheck all
        document.querySelectorAll('.animal-select-checkbox').forEach(cb => cb.checked = false);
        updateBatchActionsBarVisibility();
    } catch(e) {
        showSfmAppNotification("خطأ في تسجيل النقل.", "error");
    }
}

function populateAnimalFilterDropdowns() {
    const breedSelect = document.getElementById('animalFilterBreed'); const statusSelect = document.getElementById('animalFilterStatus');
    if(breedSelect && breedSelect.options.length <=1) { const breeds = [...new Set(sfmData.animals.map(a => a.breed).concat(sfmData.settings.customBreeds || []))]; [...new Set(breeds)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ar')).forEach(breed => breedSelect.add(new Option(breed, breed))); }
    if(statusSelect && statusSelect.options.length <=1) { const statuses = {'active':'نشط', 'sold':'مباع', 'culled_dead':'مستبعد/نافق', 'quarantined':'في الحجر'}; Object.entries(statuses).forEach(([val, text]) => statusSelect.add(new Option(text, val))); }
}
function calculateAge(birthDateStr) { if (!birthDateStr) return 'N/A'; const birthDate = new Date(birthDateStr); const today = new Date(); let years = today.getFullYear() - birthDate.getFullYear(); let months = today.getMonth() - birthDate.getMonth(); if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; } return years > 0 ? `${years} س و ${months} ش` : `${months} ش`; }
function getAnimalStatusText(status) { const statuses = {'active':'نشط', 'sold':'مباع', 'culled_dead':'مستبعد/نافق', 'quarantined':'في الحجر'}; return statuses[status] || status; }
function openWeightLogFormModal(animalId) { sfmCurrentlyEditingId = animalId; const animal = sfmData.animals.find(a => a.id === animalId); if (!animal) return; const latestWeightEntry = animal.weightHistory && animal.weightHistory.length > 0 ? [...animal.weightHistory].sort((a,b) => new Date(b.date) - new Date(a.date))[0] : {weight:0}; const formHTML = `<h4>تسجيل وزن لـ: ${animal.tagId} (${animal.name || animal.breed})</h4><div class="input-field"><label for="weightLogFormDate">تاريخ الوزن:</label><input type="date" id="weightLogFormDate" value="${new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="weightLogFormWeight">الوزن (كجم):</label><input type="number" id="weightLogFormWeight" value="${latestWeightEntry.weight}" step="0.1" inputmode="decimal" min="0"></div><div class="input-field"><label for="weightLogFormType">نوع الوزن:</label><select id="weightLogFormType"><option value="routine">دوري</option><option value="weaning">فطام</option><option value="pre_sale">قبل البيع</option><option value="birth">ميلاد</option></select></div>`; openSfmFormModal("تسجيل وزن جديد", formHTML, 'saveWeightLog'); }
function saveWeightLog() { const animalId = sfmCurrentlyEditingId; const animal = sfmData.animals.find(a => a.id === animalId); if (!animal) return; try { const date = getStrVal('weightLogFormDate', true); const weight = getSfmVal('weightLogFormWeight'); const type = getSfmStrVal('weightLogFormType'); if (weight <= 0) { showSfmAppNotification("الوزن يجب أن يكون أكبر من صفر.", "error"); return; } if (!animal.weightHistory) animal.weightHistory = []; animal.weightHistory.push({date, weight, type}); animal.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date)); saveSfmDataToLocalStorage(); renderAnimalList(); closeSfmFormModal(); showSfmAppNotification("تم تسجيل الوزن بنجاح.", "success"); renderDashboard(); } catch(e){return;}}
function openMovementLogFormModal(animalId) { sfmCurrentlyEditingId = animalId; const animal = sfmData.animals.find(a => a.id === animalId); if (!animal) return; const formHTML = `<h4>تسجيل حركة لـ: ${animal.tagId}</h4><div class="input-field"><label for="movementLogFormDate">تاريخ الحركة:</label><input type="date" id="movementLogFormDate" value="${new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="movementLogFormFrom">من (مجموعة/حظيرة):</label><input type="text" id="movementLogFormFrom" value="${animal.currentLocation || ''}"></div><div class="input-field"><label for="movementLogFormTo">إلى (مجموعة/حظيرة):</label><input type="text" id="movementLogFormTo" required></div><div class="input-field"><label for="movementLogFormReason">السبب:</label><input type="text" id="movementLogFormReason"></div>`; openSfmFormModal("تسجيل حركة حيوان", formHTML, 'saveMovementLog');}
function saveMovementLog() { const animalId = sfmCurrentlyEditingId; const animal = sfmData.animals.find(a => a.id === animalId); if (!animal) return; try { const movementData = { date: getStrVal('movementLogFormDate', true), from: getSfmStrVal('movementLogFormFrom'), to: getSfmStrVal('movementLogFormTo', true), reason: getSfmStrVal('movementLogFormReason')}; if(!animal.movementLog) animal.movementLog = []; animal.movementLog.push(movementData); animal.currentLocation = movementData.to; saveSfmDataToLocalStorage(); closeSfmFormModal(); showSfmAppNotification("تم تسجيل الحركة.", "success"); renderAnimalList();} catch(e){return;}}

function openMatingFormModal(matingId = null) { sfmCurrentlyEditingId = matingId; const mating = matingId ? sfmData.matings.find(m => m.id === matingId) : {}; const title = matingId ? "تعديل سجل تزاوج" : "تسجيل تزاوج جديد"; const ewesOptions = sfmData.animals.filter(a=>a.sex==='female' && a.status==='active').map(e => `<option value="${e.id}" ${mating.eweId === e.id ? 'selected':''}>${e.tagId} (${e.name || e.breed})</option>`).join(''); const ramsOptions = sfmData.animals.filter(a=>a.sex==='male' && a.status==='active').map(r => `<option value="${r.id}" ${mating.ramId === r.id ? 'selected':''}>${r.tagId} (${r.name || r.breed})</option>`).join(''); const formHTML = `<div class="input-field"><label for="matingFormEweId">النعجة:</label><select id="matingFormEweId" required>${ewesOptions}</select></div><div class="input-field"><label for="matingFormRamId">الكبش:</label><select id="matingFormRamId" required>${ramsOptions}</select></div><div class="input-field"><label for="matingFormDate">تاريخ التزاوج:</label><input type="date" id="matingFormDate" value="${mating.date || new Date().toISOString().split('T')[0]}" required></div><div class="input-field"><label for="matingFormExpectedDueDate">تاريخ الولادة المتوقع:</label><input type="date" id="matingFormExpectedDueDate" value="${mating.expectedDueDate || ''}" readonly></div><div class="input-field"><label for="matingFormStatus">الحالة:</label><select id="matingFormStatus"><option value="mated" ${mating.status === 'mated' || !matingId ? 'selected':''}>تم التلقيح</option><option value="pregnant" ${mating.status === 'pregnant' ? 'selected':''}>عشار مؤكد</option><option value="lambed" ${mating.status === 'lambed' ? 'selected':''}>ولدت</option><option value="failed" ${mating.status === 'failed' ? 'selected':''}>فشل الحمل</option></select></div><div class="input-field"><label for="matingFormNotes">ملاحظات:</label><textarea id="matingFormNotes" rows="2">${mating.notes || ''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveMating'); const matingDateEl = document.getElementById('matingFormDate'); if(matingDateEl) matingDateEl.addEventListener('input', calculateMatingExpectedDueDate); if(!mating.expectedDueDate && getStrVal('matingFormDate')) calculateMatingExpectedDueDate(); }
function calculateMatingExpectedDueDate() { const matingDateStr = getStrVal('matingFormDate'); if(matingDateStr){ const matingDate = new Date(matingDateStr); matingDate.setDate(matingDate.getDate() + 150); setSfmVal('matingFormExpectedDueDate', matingDate.toISOString().split('T')[0]); }}
function saveMating() { const matingId = sfmCurrentlyEditingId; try{ const matingData = { id: matingId || generateUUID(), eweId: getSfmStrVal('matingFormEweId', true), ramId: getSfmStrVal('matingFormRamId', true), date: getSfmStrVal('matingFormDate', true), expectedDueDate: getSfmStrVal('matingFormExpectedDueDate'), status: getSfmStrVal('matingFormStatus'), notes: getSfmStrVal('matingFormNotes') }; if (matingId) { const index = sfmData.matings.findIndex(m => m.id === matingId); if (index > -1) sfmData.matings[index] = matingData; } else { sfmData.matings.push(matingData); } saveSfmDataToLocalStorage(); renderMatingRecords(); closeSfmFormModal(); renderDashboard(); showSfmAppNotification(matingId ? "تم تحديث سجل التزاوج." : "تم تسجيل التزاوج.", "success");}catch(e){return;}}
function renderMatingRecords() { const tableBody = document.getElementById('matingRecordsTableBody'); const noMsg = document.getElementById('noMatingsMessage'); if(!tableBody || !noMsg) return; const records = sfmData.matings.sort((a,b) => new Date(b.date) - new Date(a.date)); if (records.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; tableBody.innerHTML = records.map(mating => `<tr><td>${sfmData.animals.find(a=>a.id===mating.eweId)?.tagId || mating.eweId.slice(0,6)}</td><td>${sfmData.animals.find(a=>a.id===mating.ramId)?.tagId || mating.ramId.slice(0,6)}</td><td>${sfmFormatDate(mating.date)}</td><td>${sfmFormatDate(mating.expectedDueDate)}</td><td>${getMatingStatusText(mating.status)}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openMatingFormModal('${mating.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('matings', '${mating.id}', renderMatingRecords)">🗑️</button></td></tr>`).join(''); }
function getMatingStatusText(status){ const statuses = {mated: 'تم التلقيح', pregnant: 'عشار مؤكد', lambed: 'ولدت', failed: 'فشل الحمل'}; return statuses[status] || status; }

function openLambingFormModal(lambingId = null) { sfmCurrentlyEditingId = lambingId; const lambing = lambingId ? sfmData.lambings.find(l => l.id === lambingId) : {}; const title = lambingId ? "تعديل ولادة" : "تسجيل ولادة"; const ewesHTML = sfmData.matings.filter(m => m.status === 'pregnant' || (m.status === 'mated' && m.expectedDueDate && new Date(m.expectedDueDate) < new Date(Date.now() + 30*24*60*60*1000))).map(m => sfmData.animals.find(a => a.id === m.eweId)).filter(Boolean).map(e => `<option value="${e.id}" ${lambing.damId === e.id ? 'selected':''}>${e.tagId} (${e.name || e.breed})</option>`).join(''); const formHTML = `<div class="input-field"><label for="lambingFormDamId">الأم:</label><select id="lambingFormDamId">${ewesHTML}</select></div><div class="input-field"><label for="lambingFormDate">تاريخ الولادة:</label><input type="date" id="lambingFormDate" value="${lambing.date || new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="lambingFormLambsBornCount">عدد المواليد:</label><input type="number" id="lambingFormLambsBornCount" value="${lambing.lambsBorn || 1}" min="1"></div><div id="lambDetailsContainer"></div><div class="input-field"><label for="lambingFormNotes">ملاحظات:</label><textarea id="lambingFormNotes" rows="2">${lambing.notes||''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveLambing', null, 'large'); const lbc = document.getElementById('lambingFormLambsBornCount'); if(lbc){ lbc.addEventListener('input', (e) => generateLambDetailInputs(e.target.value, lambing.lambsData)); generateLambDetailInputs(lbc.value, lambing.lambsData);}}
function generateLambDetailInputs(count, existingLambsData = null) { const container = document.getElementById('lambDetailsContainer'); if (!container) return; container.innerHTML = ''; count = parseInt(count) || 0; for (let k = 0; k < count; k++) { const ed = existingLambsData && existingLambsData[k] ? existingLambsData[k] : {}; container.innerHTML += `<div class="card" style="margin-top:10px; background-color:#f9f9f9;"><strong>المولود ${k + 1}:</strong><div class="input-grid"><div class="input-field"><label for="lambTagId${k}">الرقم:</label><input type="text" id="lambTagId${k}" value="${ed.tagId || ''}" placeholder="ID (اختياري الآن)"></div><div class="input-field"><label for="lambSex${k}">الجنس:</label><select id="lambSex${k}"><option value="male" ${ed.sex==='male' ? 'selected':''}>ذكر</option><option value="female" ${ed.sex==='female' ? 'selected':''}>أنثى</option></select></div><div class="input-field"><label for="lambBirthWeight${k}">وزن الميلاد (كجم):</label><input type="number" id="lambBirthWeight${k}" value="${ed.birthWeight || 0}" step="0.1"></div></div></div>`; }}
function saveLambing() { const lambingId = sfmCurrentlyEditingId; try { const damId = getSfmStrVal('lambingFormDamId', true); const date = getSfmStrVal('lambingFormDate', true); const lambsBornCount = parseInt(getVal('lambingFormLambsBornCount')); if(lambsBornCount <= 0) {showSfmAppNotification("عدد المواليد يجب أن يكون أكبر من صفر.","error"); return;} const lambsData = []; for (let k = 0; k < lambsBornCount; k++) { const lambTagId = getSfmStrVal(`lambTagId${k}`); const lambSex = getSfmStrVal(`lambSex${k}`); const lambBirthWeight = getSfmVal(`lambBirthWeight${k}`); const lambUUID = (lambingId && sfmData.lambings.find(l=>l.id===lambingId)?.lambsData[k]?.id) || generateUUID(); lambsData.push({ tagId: lambTagId, sex: lambSex, birthWeight: lambBirthWeight, id: lambUUID }); if(lambTagId) { const existingLamb = sfmData.animals.find(a => a.id === lambUUID || a.tagId === lambTagId); const dam = sfmData.animals.find(a => a.id === damId); const sireFromMating = sfmData.matings.find(m => m.eweId === damId && (m.status === 'pregnant' || m.status === 'lambed')); if(existingLamb) { existingLamb.tagId = lambTagId; existingLamb.sex = lambSex; existingLamb.birthDate = date; existingLamb.damId = damId; if(sireFromMating) existingLamb.sireId = sireFromMating.ramId; if (!existingLamb.weightHistory) existingLamb.weightHistory = []; const birthWeightEntry = existingLamb.weightHistory.find(wh => wh.type === 'birth'); if(birthWeightEntry && lambBirthWeight > 0) birthWeightEntry.weight = lambBirthWeight; else if (lambBirthWeight > 0) existingLamb.weightHistory.push({date: date, weight: lambBirthWeight, type: 'birth'});} else if (!sfmData.animals.find(a => a.tagId === lambTagId)) { sfmData.animals.push({ id: lambUUID, tagId: lambTagId, name: `مولود-${lambTagId.slice(-4)}`, breed: dam ? dam.breed : (sfmData.settings.customBreeds[0] || "بلدي"), sex: lambSex, birthDate: date, damId: damId, sireId: sireFromMating ? sireFromMating.ramId : '', status: 'active', notes: `مولود بتاريخ ${date}`, weightHistory: lambBirthWeight > 0 ? [{date: date, weight: lambBirthWeight, type: 'birth'}] : [] });}}} const lambingData = { id: lambingId || generateUUID(), damId, date, lambsBorn: lambsBornCount, lambsData, notes: getSfmStrVal('lambingFormNotes') }; if (lambingId) { const index = sfmData.lambings.findIndex(l => l.id === lambingId); if (index > -1) sfmData.lambings[index] = lambingData; } else { sfmData.lambings.push(lambingData); } const matingRecord = sfmData.matings.find(m => m.eweId === damId && (m.status === 'pregnant')); if(matingRecord) matingRecord.status = 'lambed'; saveSfmDataToLocalStorage(); renderLambingRecords(); renderMatingRecords(); renderAnimalList(); closeSfmFormModal(); renderDashboard(); showSfmAppNotification("تم حفظ الولادة.", "success"); }catch(e){return;}}
function renderLambingRecords() { const tableBody = document.getElementById('lambingRecordsTableBody'); const noMsg = document.getElementById('noLambingsMessage'); if(!tableBody || !noMsg) return; const records = sfmData.lambings.sort((a,b) => new Date(b.date) - new Date(a.date)); if (records.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; tableBody.innerHTML = records.map(l => `<tr><td>${sfmData.animals.find(a=>a.id===l.damId)?.tagId || 'N/A'}</td><td>${sfmFormatDate(l.date)}</td><td>${l.lambsBorn}</td><td>${l.lambsData.map(ld => ld.tagId||'(جديد)').join(', ')}</td><td>${l.notes||'-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openLambingFormModal('${l.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('lambings', '${l.id}', renderLambingRecords)">🗑️</button></td></tr>`).join(''); }

function openWeaningFormModal(weaningId = null) { sfmCurrentlyEditingId = weaningId; const weaning = weaningId ? sfmData.weanings.find(w => w.id === weaningId) : {}; const title = weaningId ? "تعديل فطام" : "تسجيل فطام"; const lambsHTML = sfmData.animals.filter(a => isAnimalLamb(a.birthDate,12) && a.status === 'active' && (!sfmData.weanings.find(w=>w.lambId === a.id) || (weaningId && a.id === weaning.lambId))).map(l=>`<option value="${l.id}" ${weaning.lambId === l.id ? 'selected':''}>${l.tagId} (${l.name || l.breed})</option>`).join(''); const formHTML = `<div class="input-field"><label for="weaningFormLambId">الحملان:</label><select id="weaningFormLambId" ${!weaningId ? 'multiple size="5"' : ''}>${lambsHTML}</select></div><div class="input-field"><label for="weaningFormDate">تاريخ الفطام:</label><input type="date" id="weaningFormDate" value="${weaning.date || new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="weaningFormWeight">متوسط وزن الفطام (كجم):</label><input type="number" id="weaningFormWeight" value="${weaning.weight || 0}" step="0.1"></div><div class="input-field"><label for="weaningFormNotes">ملاحظات:</label><textarea id="weaningFormNotes" rows="2">${weaning.notes||''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveWeaning');}
function saveWeaning() { const weaningId = sfmCurrentlyEditingId; try{const lambIds = weaningId ? [getSfmStrVal('weaningFormLambId', true)] : Array.from(document.getElementById('weaningFormLambId').selectedOptions).map(opt => opt.value); const date = getSfmStrVal('weaningFormDate', true); const weight = getSfmVal('weaningFormWeight'); const notes = getSfmStrVal('weaningFormNotes'); if(lambIds.length === 0) {showSfmAppNotification("اختر الحملان.","error"); return;} lambIds.forEach(lambId => { const weaningData = {id: (weaningId && lambIds.length === 1 ? weaningId : generateUUID()), lambId, date, weight, notes}; const lamb = sfmData.animals.find(a => a.id === lambId); if(lamb && weight > 0) { if(!lamb.weightHistory) lamb.weightHistory=[]; lamb.weightHistory.push({date, weight, type:'weaning'}); lamb.weightHistory.sort((a,b)=>new Date(a.date)-new Date(b.date));} if (weaningId && lambIds.length === 1) { const index = sfmData.weanings.findIndex(w => w.id === weaningId); if (index > -1) sfmData.weanings[index] = weaningData;} else { sfmData.weanings.push(weaningData);}}); saveSfmDataToLocalStorage(); renderWeaningRecords(); renderAnimalList(); closeSfmFormModal(); showSfmAppNotification("تم حفظ الفطام.","success");} catch(e){return;}}
function renderWeaningRecords(){ const tableBody = document.getElementById('weaningRecordsTableBody'); const noMsg = document.getElementById('noWeaningsMessage'); if(!tableBody || !noMsg) return; const records = sfmData.weanings.sort((a,b) => new Date(b.date) - new Date(a.date)); if(records.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; tableBody.innerHTML = records.map(w => { const lamb = sfmData.animals.find(a=>a.id===w.lambId); return `<tr><td>${lamb ? (lamb.tagId || lamb.name || 'N/A') : 'N/A'}</td><td>${sfmFormatDate(w.date)}</td><td>${w.weight || '-'} كجم</td><td>${w.notes||'-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openWeaningFormModal('${w.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('weanings', '${w.id}', renderWeaningRecords)">🗑️</button></td></tr>`}).join('');}

function openHealthRecordFormModal(recordId = null) { sfmCurrentlyEditingId = recordId; const record = recordId ? sfmData.healthRecords.find(hr => hr.id === recordId) : {}; const title = recordId ? "تعديل سجل صحي" : "إضافة سجل صحي"; const animalsHTML = sfmData.animals.filter(a=>a.status==='active').map(a=>`<option value="${a.id}" ${record.animalId===a.id ? 'selected':''}>${a.tagId} (${a.name||a.breed})</option>`).join(''); const medsHTML = sfmData.inventory.filter(i=>i.type==='medication').map(m=>`<option value="${m.id}" ${record.medicationId===m.id ? 'selected':''}>${m.name} (متاح: ${m.currentStock} ${m.unit})</option>`).join(''); const formHTML = `<div class="input-field"><label for="healthFormAnimalId">الحيوان:</label><select id="healthFormAnimalId">${animalsHTML}</select></div><div class="input-field"><label for="healthFormDate">التاريخ:</label><input type="date" id="healthFormDate" value="${record.date || new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="healthFormRecordType">النوع:</label><select id="healthFormRecordType"><option value="treatment" ${record.type==='treatment'?'selected':''}>علاج</option><option value="vaccination" ${record.type==='vaccination'?'selected':''}>تحصين</option><option value="deworming" ${record.type==='deworming'?'selected':''}>مكافحة طفيليات</option><option value="checkup" ${record.type==='checkup'?'selected':''}>فحص</option></select></div><div class="input-field"><label for="healthFormCondition">التشخيص/التحصين:</label><input type="text" id="healthFormCondition" value="${record.condition||''}"></div><div class="input-field"><label for="healthFormMedicationId">الدواء (من المخزون):</label><select id="healthFormMedicationId"><option value="">-- لا يوجد --</option>${medsHTML}</select></div><div class="input-field"><label for="healthFormMedicationCustom">الدواء (اسم مخصص إن لم يكن بالمخزون):</label><input type="text" id="healthFormMedicationCustom" value="${record.medication && !sfmData.inventory.find(inv=>inv.id===record.medicationId && inv.name===record.medication) ? record.medication : ''}"></div><div class="input-grid"><div class="input-field"><label for="healthFormDosage">الجرعة:</label><input type="text" id="healthFormDosage" value="${record.dosage||''}"></div><div class="input-field"><label for="healthFormQuantityUsed">الكمية المستخدمة:</label><input type="number" id="healthFormQuantityUsed" value="${record.quantityUsed||0}" min="0" step="any"></div></div><div class="input-field"><label for="healthFormWithdrawalPeriod">فترة السحب (أيام):</label><input type="number" id="healthFormWithdrawalPeriod" value="${record.withdrawalPeriod||0}" min="0"></div><div class="input-field"><label for="healthFormNextDueDate">المتابعة/الجرعة التالية:</label><input type="date" id="healthFormNextDueDate" value="${record.nextDueDate||''}"></div><div class="input-field"><label for="healthFormNotes">ملاحظات:</label><textarea id="healthFormNotes" rows="2">${record.notes||''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveHealthRecord');}
function saveHealthRecord() { const recordId = sfmCurrentlyEditingId; try { const medicationFromSelectId = getSfmStrVal('healthFormMedicationId'); const medicationCustom = getSfmStrVal('healthFormMedicationCustom'); const medicationNameToSave = medicationCustom || (sfmData.inventory.find(i=>i.id===medicationFromSelectId)?.name || ''); const quantityUsed = getSfmVal('healthFormQuantityUsed'); const healthData = { id: recordId || generateUUID(), animalId: getSfmStrVal('healthFormAnimalId', true), date: getSfmStrVal('healthFormDate', true), type: getSfmStrVal('healthFormRecordType'), condition: getSfmStrVal('healthFormCondition', true), medication: medicationNameToSave, medicationId: medicationFromSelectId, quantityUsed: quantityUsed, dosage: getSfmStrVal('healthFormDosage'), withdrawalPeriod: getSfmVal('healthFormWithdrawalPeriod'), nextDueDate: getStrVal('healthFormNextDueDate') || null, notes: getSfmStrVal('healthFormNotes') }; if(medicationFromSelectId && quantityUsed > 0) { const invItem = sfmData.inventory.find(item => item.id === medicationFromSelectId); if (invItem) { invItem.currentStock = Math.max(0, invItem.currentStock - quantityUsed); renderInventoryList(); } else { showSfmAppNotification("الدواء المختار غير موجود بالمخزون للخصم.", "warn");}} if (recordId) { const index = sfmData.healthRecords.findIndex(hr => hr.id === recordId); if (index > -1) sfmData.healthRecords[index] = healthData; } else { sfmData.healthRecords.push(healthData); } saveSfmDataToLocalStorage(); renderHealthRecords(); closeSfmFormModal(); renderDashboard(); showSfmAppNotification("تم حفظ السجل الصحي.", "success"); } catch(e){return;} }
function renderHealthRecords() { const tableBody = document.getElementById('healthRecordsTableBody'); const noMsg = document.getElementById('noHealthRecordsMessage'); if(!tableBody || !noMsg) return; const searchTerm = getStrVal('healthSearchInput').toLowerCase(); const records = sfmData.healthRecords.filter(hr => { const animal = sfmData.animals.find(a => a.id === hr.animalId); return (animal && (animal.tagId.toLowerCase().includes(searchTerm) || (animal.name && animal.name.toLowerCase().includes(searchTerm)))) || hr.condition.toLowerCase().includes(searchTerm) || (hr.medication && hr.medication.toLowerCase().includes(searchTerm)); }).sort((a,b) => new Date(b.date) - new Date(a.date)); if (records.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; tableBody.innerHTML = records.map(hr => { const animal = sfmData.animals.find(a => a.id === hr.animalId); return `<tr><td>${animal ? animal.tagId : 'محذوف'}</td><td>${sfmFormatDate(hr.date)}</td><td>${getHealthRecordTypeText(hr.type)}</td><td>${hr.condition}</td><td>${hr.medication || '-'}</td><td>${hr.withdrawalPeriod > 0 ? hr.withdrawalPeriod + ' يوم' : '-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openHealthRecordFormModal('${hr.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('healthRecords', '${hr.id}', renderHealthRecords)">🗑️</button></td></tr>`; }).join('');}
function filterHealthRecords(){ renderHealthRecords(); } function getHealthRecordTypeText(type){ const types = {treatment:'علاج', vaccination:'تحصين', deworming:'مكافحة طفيليات', checkup:'فحص دوري'}; return types[type] || type; }

function openFeedRationFormModal(rationId = null) { sfmCurrentlyEditingId = rationId; const ration = rationId ? sfmData.feedRations.find(r => r.id === rationId) : {}; const title = rationId ? "تعديل خلطة علف" : "إضافة خلطة علف جديدة"; let compositionHTML = '<div id="rationCompositionContainer">'; const existingCompositions = ration.composition || [{ingredientId: '', percentage: ''}]; existingCompositions.forEach((comp, index) => { compositionHTML += `<div class="input-grid-3 ration-ingredient-row" style="align-items:flex-end; margin-bottom:8px;"><div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientId${index}">المكون:</label><select id="ingredientId${index}">${getFeedInventoryOptionsForRation(comp.ingredientId)}</select></div><div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientPercentage${index}">النسبة (%):</label><input type="number" id="ingredientPercentage${index}" value="${comp.percentage || ''}" min="0" max="100" step="0.1" inputmode="decimal"></div><button type="button" class="btn btn-sm btn-danger" style="height:36px; padding:0 8px; margin-bottom:0;" onclick="removeRationIngredientRow(this)">✕</button></div>`; }); compositionHTML += '</div><button type="button" class="btn btn-sm btn-secondary" onclick="addRationIngredientRow()">إضافة مكون آخر</button>'; const formHTML = `<div class="input-field"><label for="feedRationName">اسم الخلطة/المجموعة:</label><input type="text" id="feedRationName" value="${ration.name || ''}" required></div>${compositionHTML}<div class="input-field" style="margin-top:15px;"><label for="feedRationNotes">ملاحظات الخلطة:</label><textarea id="feedRationNotes" rows="2">${ration.notes || ''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveFeedRation'); }
function getFeedInventoryOptionsForRation(selectedIngredientId = null) { return sfmData.inventory.filter(item => item.type === 'feed').map(item => `<option value="${item.id}" ${selectedIngredientId === item.id ? 'selected':''}>${item.name}</option>`).join(''); }
function addRationIngredientRow() { const container = document.getElementById('rationCompositionContainer'); if(!container) return; const index = container.children.length; const newRow = document.createElement('div'); newRow.className = 'input-grid-3 ration-ingredient-row'; newRow.style.alignItems = 'flex-end'; newRow.style.marginBottom = '8px'; newRow.innerHTML = `<div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientId${index}">المكون:</label><select id="ingredientId${index}">${getFeedInventoryOptionsForRation()}</select></div><div class="input-field-sm" style="margin-bottom:0;"><label for="ingredientPercentage${index}">النسبة (%):</label><input type="number" id="ingredientPercentage${index}" value="" min="0" max="100" step="0.1" inputmode="decimal"></div><button type="button" class="btn btn-sm btn-danger" style="height:36px; padding:0 8px; margin-bottom:0;" onclick="removeRationIngredientRow(this)">✕</button>`; container.appendChild(newRow); }
function removeRationIngredientRow(button) { button.parentElement.remove(); }
function saveFeedRation() { const rationId = sfmCurrentlyEditingId; try{ const name = getSfmStrVal('feedRationName', true); const composition = []; const ingredientRows = document.querySelectorAll('#rationCompositionContainer .ration-ingredient-row'); let totalPercentage = 0; for (let k = 0; k < ingredientRows.length; k++) { const ingredientId = getSfmStrVal(`ingredientId${k}`); const percentage = getSfmVal(`ingredientPercentage${k}`); if (ingredientId && percentage > 0) { composition.push({ ingredientId, percentage }); totalPercentage += percentage; }} if (composition.length === 0) { showSfmAppNotification("يجب إضافة مكون واحد على الأقل.", "error"); return; } if (Math.abs(totalPercentage - 100) > 1) { showSfmAppNotification("مجموع نسب المكونات يجب أن يكون 100% تقريباً.", "error"); return; } const rationData = { id: rationId || generateUUID(), name, composition, notes: getSfmStrVal('feedRationNotes') }; if (rationId) { const index = sfmData.feedRations.findIndex(r => r.id === rationId); if (index > -1) sfmData.feedRations[index] = rationData; } else { sfmData.feedRations.push(rationData); } saveSfmDataToLocalStorage(); populateFeedRationSelect(); displaySelectedRation(); closeSfmFormModal(); showSfmAppNotification("تم حفظ الخلطة.", "success"); } catch(e){return;}}
function populateFeedRationSelect() { const select = document.getElementById('feedRationSelect'); if(!select) return; const currentVal = select.value; select.innerHTML = '<option value="">-- اختر خلطة --</option>'; sfmData.feedRations.forEach(ration => select.add(new Option(ration.name, ration.id))); if(sfmData.feedRations.find(r=>r.id === currentVal)) select.value = currentVal; else select.value = ""; displaySelectedRation(); }
function displaySelectedRation() { const rationId = getStrVal('feedRationSelect'); const displayArea = document.getElementById('feedRationDetailsDisplay'); if(!displayArea) return; const ration = sfmData.feedRations.find(r => r.id === rationId); if (ration) { let html = `<h5>مكونات ${ration.name}:</h5><ul style="padding-right:20px; margin-bottom:10px;">`; ration.composition.forEach(comp => { const ingredient = sfmData.inventory.find(item => item.id === comp.ingredientId); html += `<li>${ingredient ? ingredient.name : 'مكون محذوف'}: ${comp.percentage}%</li>`; }); html += `</ul>${ration.notes ? `<p><em>ملاحظات: ${ration.notes}</em></p>` : ''}`; html += `<button class="btn btn-sm btn-secondary" onclick="openFeedRationFormModal('${ration.id}')">تعديل</button>`; displayArea.innerHTML = html; } else { displayArea.innerHTML = '<p style="text-align:center; color:#888;">اختر خلطة لعرض تفاصيلها.</p>'; } }
function openFeedConsumptionLogModal(){ const rationsOptions = sfmData.feedRations.map(r => `<option value="${r.id}">${r.name}</option>`).join(''); const formHTML = `<div class="input-field"><label for="feedLogFormDate">التاريخ:</label><input type="date" id="feedLogFormDate" value="${new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="feedLogFormRationId">الخلطة المستخدمة:</label><select id="feedLogFormRationId"><option value="">-- اختر خلطة --</option>${rationsOptions}</select></div><div class="input-field"><label for="feedLogFormTarget">مقدمة لـ (اسم المجموعة/الحيوان):</label><input type="text" id="feedLogFormTarget" placeholder="مثال: نعاج عشار، كل القطيع"></div><div class="input-field"><label for="feedLogFormAmount">الكمية المستهلكة (كجم):</label><input type="number" id="feedLogFormAmount" min="0" step="0.1" inputmode="decimal"></div><div class="input-field"><label for="feedLogFormNotes">ملاحظات:</label><textarea id="feedLogFormNotes" rows="2"></textarea></div>`; openSfmFormModal("تسجيل استهلاك علف", formHTML, 'saveFeedConsumptionLog'); }
function saveFeedConsumptionLog() { try { const logEntry = { id: generateUUID(), date: getStrVal('feedLogFormDate', true), rationId: getSfmStrVal('feedLogFormRationId', true), target: getSfmStrVal('feedLogFormTarget', true), amount: getSfmVal('feedLogFormAmount'), notes: getSfmStrVal('feedLogFormNotes') }; if(logEntry.amount <=0) {showSfmAppNotification("كمية العلف يجب أن تكون أكبر من صفر.","error"); return;} const ration = sfmData.feedRations.find(r => r.id === logEntry.rationId); if (ration) { ration.composition.forEach(comp => { const invItem = sfmData.inventory.find(item => item.id === comp.ingredientId); if (invItem) { const amountToDeduct = logEntry.amount * (comp.percentage / 100); invItem.currentStock = Math.max(0, invItem.currentStock - amountToDeduct); }});} sfmData.feedConsumptionLog.push(logEntry); saveSfmDataToLocalStorage(); closeSfmFormModal(); renderInventoryList(); renderDashboard(); showSfmAppNotification("تم تسجيل استهلاك العلف وتحديث المخزون.", "success"); } catch(e){return;}}
function logWaterConsumption() { try { const date = getStrVal('waterConsumptionDate', true); const amount = getSfmVal('waterConsumptionAmount'); if(amount <=0) {showSfmAppNotification("كمية الماء يجب أن تكون أكبر من صفر.", "error"); return;} sfmData.waterLog.push({date, amount, id: generateUUID()}); saveSfmDataToLocalStorage(); showSfmAppNotification(`تم تسجيل ${amount} لتر ماء ليوم ${sfmFormatDate(date)}.`, "success"); setVal('waterConsumptionAmount', 0); renderWaterLog(); } catch(e){return; } }
function renderWaterLog() { const display = document.getElementById('waterLogDisplay'); if(!display) return; const recentLogs = sfmData.waterLog.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5); if(recentLogs.length === 0) { display.innerHTML = '<p class="list-empty-message">لا يوجد سجل لاستهلاك المياه.</p>'; return; } display.innerHTML = '<h5>آخر تسجيلات استهلاك المياه:</h5><ul class="task-list" style="font-size:0.9em;">' + recentLogs.map(log => `<li><span>${sfmFormatDate(log.date)}:</span><strong>${log.amount} لتر</strong></li>`).join('') + '</ul>'; }

function openInventoryItemFormModal(itemId = null) { sfmCurrentlyEditingId = itemId; const item = itemId ? sfmData.inventory.find(i => i.id === itemId) : {}; const title = itemId ? "تعديل عنصر المخزون" : "إضافة عنصر جديد"; const currentFeedTypes = sfmData.settings.customFeedTypes || []; const feedTypesOptions = currentFeedTypes.map(ft => `<option value="${ft}" ${item.name === ft && item.type==='feed' ? 'selected':''}>${ft}</option>`).join(''); const formHTML = `<div class="input-field"><label for="inventoryFormItemType">نوع العنصر:</label><select id="inventoryFormItemType" onchange="toggleInventoryCustomNameField(this.value)"><option value="feed" ${item.type === 'feed' || !itemId ? 'selected':''}>علف</option><option value="medication" ${item.type === 'medication' ? 'selected':''}>دواء</option><option value="supply" ${item.type === 'supply' ? 'selected':''}>مستلزمات</option><option value="product" ${item.type === 'product' ? 'selected':''}>منتج للبيع</option></select></div><div id="inventoryCustomFeedTypeDiv" class="input-field" style="display:${(item.type === 'feed' || !itemId) ? 'block':'none'};"><label for="inventoryFormItemFeedType">اختر نوع العلف (أو اسم مخصص):</label> <select id="inventoryFormItemFeedType"><option value="">-- اسم مخصص --</option>${feedTypesOptions}</select></div><div class="input-field"><label for="inventoryFormItemName">اسم العنصر:</label><input type="text" id="inventoryFormItemName" value="${item.name || ''}" required></div><div class="input-field"><label for="inventoryFormItemUnit">وحدة القياس:</label><input type="text" id="inventoryFormItemUnit" value="${item.unit || 'كجم'}"></div><div class="input-field"><label for="inventoryFormItemStock">الكمية الحالية:</label><input type="number" id="inventoryFormItemStock" value="${item.currentStock || 0}" min="0"></div><div class="input-field"><label for="inventoryFormItemReorderLevel">حد الطلب:</label><input type="number" id="inventoryFormItemReorderLevel" value="${item.reorderLevel || 0}" min="0"></div><div class="input-field"><label for="inventoryFormLastPurchasePrice">آخر سعر شراء (للوحدة):</label><input type="number" id="inventoryFormLastPurchasePrice" value="${item.lastPurchasePrice || 0}" min="0"></div>`; openSfmFormModal(title, formHTML, 'saveInventoryItem'); toggleInventoryCustomNameField(getStrVal('inventoryFormItemType')); const feedTypeSelect = document.getElementById('inventoryFormItemFeedType'); if(feedTypeSelect && item.type==='feed' && currentFeedTypes.includes(item.name)) { feedTypeSelect.value = item.name; const nameField = document.getElementById('inventoryFormItemName'); if(nameField) nameField.readOnly = true;} feedTypeSelect?.addEventListener('change', function(){ const nameField = document.getElementById('inventoryFormItemName'); if(this.value && nameField) { nameField.value = this.value; nameField.readOnly = true;} else if(nameField) {nameField.readOnly = false;} });}
function toggleInventoryCustomNameField(itemType) { const nameField = document.getElementById('inventoryFormItemName'); const customDiv = document.getElementById('inventoryCustomFeedTypeDiv'); if(!nameField || !customDiv) return; if (itemType === 'feed') { customDiv.style.display = 'block'; if(getSfmStrVal('inventoryFormItemFeedType')) {nameField.value = getSfmStrVal('inventoryFormItemFeedType'); nameField.readOnly = true;} else {nameField.readOnly = false;} } else { customDiv.style.display = 'none'; nameField.readOnly = false; } }
function saveInventoryItem() { const itemId = sfmCurrentlyEditingId; try { let itemName = getSfmStrVal('inventoryFormItemName', true); const itemType = getSfmStrVal('inventoryFormItemType'); if (itemType === 'feed' && getSfmStrVal('inventoryFormItemFeedType')) itemName = getSfmStrVal('inventoryFormItemFeedType'); if (!itemName) return; const itemData = { id: itemId || generateUUID(), name: itemName, type: itemType, unit: getSfmStrVal('inventoryFormItemUnit') || 'وحدة', currentStock: getSfmVal('inventoryFormItemStock'), reorderLevel: getSfmVal('inventoryFormItemReorderLevel'), lastPurchasePrice: getSfmVal('inventoryFormLastPurchasePrice') }; if (itemId) { const index = sfmData.inventory.findIndex(i => i.id === itemId); if (index > -1) sfmData.inventory[index] = itemData; } else { sfmData.inventory.push(itemData); } saveSfmDataToLocalStorage(); renderInventoryList(); populateFeedRationSelect(); renderDashboard(); closeSfmFormModal(); showSfmAppNotification("تم حفظ عنصر المخزون.", "success"); } catch(e){return;}}
function renderInventoryList() { const tableBody = document.getElementById('inventoryTableBody'); const noMsg = document.getElementById('noInventoryMessage'); if(!tableBody || !noMsg) return; const searchTerm = getStrVal('inventorySearchInput').toLowerCase(); const filterType = getStrVal('inventoryFilterType'); const filteredItems = sfmData.inventory.filter(item => (item.name.toLowerCase().includes(searchTerm) || item.type.toLowerCase().includes(searchTerm)) && (!filterType || item.type === filterType)).sort((a,b) => a.name.localeCompare(b.name, 'ar')); if (filteredItems.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; tableBody.innerHTML = filteredItems.map(item => `<tr class="${item.currentStock < item.reorderLevel && item.reorderLevel > 0 ? 'low-stock-warning' : ''}"><td>${item.name}</td><td>${getInventoryTypeText(item.type)}</td><td>${item.currentStock}</td><td>${item.unit}</td><td>${item.reorderLevel}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openInventoryItemFormModal('${item.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('inventory', '${item.id}', renderInventoryList)">🗑️</button></td></tr>`).join('');}
function filterInventoryList() { renderInventoryList(); } function getInventoryTypeText(type){ const types = {feed:'علف', medication:'دواء', supply:'مستلزمات', product:'منتج للبيع'}; return types[type] || type; }

function openTaskFormModal(taskId = null) { sfmCurrentlyEditingId = taskId; const task = taskId ? sfmData.tasks.find(t => t.id === taskId) : {}; const title = taskId ? "تعديل مهمة" : "إضافة مهمة جديدة"; const animalOptions = sfmData.animals.map(a => `<option value="${a.id}" ${task.relatedAnimalId === a.id ? 'selected':''}>${a.tagId} (${a.name||a.breed})</option>`).join(''); const formHTML = `<div class="input-field"><label for="taskFormTitle">عنوان المهمة:</label><input type="text" id="taskFormTitle" value="${task.title || ''}" required></div><div class="input-field"><label for="taskFormDescription">الوصف:</label><textarea id="taskFormDescription" rows="3">${task.description || ''}</textarea></div><div class="input-field"><label for="taskFormDueDate">تاريخ الاستحقاق:</label><input type="date" id="taskFormDueDate" value="${task.dueDate || new Date().toISOString().split('T')[0]}" required></div><div class="input-field"><label for="taskFormPriority">الأولوية:</label><select id="taskFormPriority"><option value="low" ${task.priority === 'low' ? 'selected':''}>منخفضة</option><option value="medium" ${task.priority === 'medium' || (!taskId && sfmData.settings.defaultTaskPriority === 'medium') ? 'selected':''}>متوسطة</option><option value="high" ${task.priority === 'high' ? 'selected':''}>عالية</option></select></div><div class="input-field"><label for="taskFormStatus">الحالة:</label><select id="taskFormStatus"><option value="pending" ${task.status === 'pending' || (!taskId && sfmData.settings.defaultTaskStatus === 'pending') ? 'selected':''}>معلقة</option><option value="in_progress" ${task.status === 'in_progress' ? 'selected':''}>قيد التنفيذ</option><option value="completed" ${task.status === 'completed' ? 'selected':''}>مكتملة</option></select></div><div class="input-field"><label for="taskFormAssignedTo">مُسندة إلى:</label><input type="text" id="taskFormAssignedTo" value="${task.assignedTo || ''}"></div><div class="input-field"><label for="taskFormRelatedAnimalId">مرتبطة بالحيوان:</label><select id="taskFormRelatedAnimalId"><option value="">-- لا يوجد --</option>${animalOptions}</select></div>`; openSfmFormModal(title, formHTML, 'saveTask'); if(task.relatedAnimalId) document.getElementById('taskFormRelatedAnimalId').value = task.relatedAnimalId;}
function saveTask() { const taskId = sfmCurrentlyEditingId; try { const taskData = { id: taskId || generateUUID(), title: getSfmStrVal('taskFormTitle', true), description: getSfmStrVal('taskFormDescription'), dueDate: getSfmStrVal('taskFormDueDate', true), priority: getSfmStrVal('taskFormPriority'), status: getSfmStrVal('taskFormStatus'), assignedTo: getSfmStrVal('taskFormAssignedTo'), relatedAnimalId: getSfmStrVal('taskFormRelatedAnimalId') || null, createdAt: taskId ? sfmData.tasks.find(t=>t.id===taskId).createdAt : new Date().toISOString() }; if (taskId) { const index = sfmData.tasks.findIndex(t => t.id === taskId); if (index > -1) sfmData.tasks[index] = taskData; } else { sfmData.tasks.push(taskData); } saveSfmDataToLocalStorage(); renderTaskList(); renderDashboard(); closeSfmFormModal(); showSfmAppNotification("تم حفظ المهمة.", "success"); } catch(e){return;}}
function renderTaskList() { const container = document.getElementById('taskListContainer'); const noMsg = document.getElementById('noTasksToListMessage'); if(!container || !noMsg) return; const filterStatus = getStrVal('taskFilterStatus'); const filterPriority = getStrVal('taskFilterPriority'); const sortBy = getStrVal('taskSortByDate'); let filteredTasks = sfmData.tasks.filter(task => (filterStatus === 'all' || task.status === filterStatus) && (filterPriority === 'all' || task.priority === filterPriority)); filteredTasks.sort((a, b) => sortBy === 'dueDateDesc' ? new Date(b.dueDate) - new Date(a.dueDate) : new Date(a.dueDate) - new Date(b.dueDate)); if (filteredTasks.length === 0) { container.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; container.innerHTML = filteredTasks.map(task => `<div class="card task-item status-${task.status} priority-${task.priority}" style="border-left: 5px solid ${task.priority === 'high' ? '#e74c3c' : task.priority === 'medium' ? '#f39c12' : '#27ae60'};"><div class="card-header" style="padding-bottom:5px; margin-bottom:8px;"><h5 class="card-title" style="font-size:1em; ${task.status === 'completed' ? 'text-decoration:line-through; color:#888;' : ''}" onclick="openTaskFormModal('${task.id}')">${task.title}</h5><div class="task-actions">${task.status !== 'completed' ? `<button class="btn btn-sm btn-success" style="padding:3px 6px; font-size:0.8em;" onclick="completeTask('${task.id}')">✓ إكمال</button>` : ''}<button class="btn btn-sm btn-secondary" style="padding:3px 6px; font-size:0.8em;" onclick="openTaskFormModal('${task.id}')">✏️</button><button class="btn btn-sm btn-danger" style="padding:3px 6px; font-size:0.8em;" onclick="deleteSfmItem('tasks', '${task.id}', renderTaskList)">🗑️</button></div></div><p style="font-size:0.9em; color:#555; margin-bottom:5px;">${task.description || 'لا يوجد وصف.'}</p><small style="color:#777;">الاستحقاق: ${sfmFormatDate(task.dueDate)} | الحالة: ${getTaskStatusText(task.status)} ${task.assignedTo ? '| مُسندة إلى: '+task.assignedTo : ''} ${task.relatedAnimalId ? '| حيوان: '+ (sfmData.animals.find(a=>a.id===task.relatedAnimalId)?.tagId || task.relatedAnimalId.slice(0,6)) : ''}</small></div>`).join('');}
function completeTask(taskId) { const task = sfmData.tasks.find(t => t.id === taskId); if (task) { task.status = 'completed'; saveSfmDataToLocalStorage(); renderTaskList(); renderDashboard(); }}
function getTaskStatusText(status){ const statuses = {pending:'معلقة', in_progress:'قيد التنفيذ', completed:'مكتملة'}; return statuses[status] || status; }

function openTransactionFormModal(transactionId = null, typeOverride = null) { sfmCurrentlyEditingId = transactionId; const transaction = transactionId ? sfmData.transactions.find(t => t.id === transactionId) : {}; const type = typeOverride || (transaction.type || 'sale'); const title = transactionId ? "تعديل معاملة" : (type === 'sale' ? "تسجيل بيع" : (type === 'purchase' ? "تسجيل شراء" : "تسجيل مصروف")); const animalsHTML = sfmData.animals.filter(a=>a.status === 'active').map(a => `<option value="${a.id}" ${transaction.relatedAnimalId === a.id ? 'selected':''}>${a.tagId} (${a.name||a.breed})</option>`).join(''); const formHTML = `<div class="input-field"><label for="transactionFormDate">التاريخ:</label><input type="date" id="transactionFormDate" value="${transaction.date || new Date().toISOString().split('T')[0]}" required></div><div class="input-field"><label for="transactionFormType">النوع:</label><select id="transactionFormType"><option value="sale" ${type === 'sale' ? 'selected':''}>بيع</option><option value="purchase" ${type === 'purchase' ? 'selected':''}>شراء</option><option value="expense" ${type === 'expense' ? 'selected':''}>مصروف</option></select></div><div class="input-field"><label for="transactionFormDescription">الوصف:</label><input type="text" id="transactionFormDescription" value="${transaction.description || ''}" required></div><div class="input-field"><label for="transactionFormAmount">المبلغ:</label><input type="number" id="transactionFormAmount" value="${transaction.amount || 0}" inputmode="numeric" required min="0.01"></div><div class="input-field"><label for="transactionFormParty">العميل/المورد:</label><input type="text" id="transactionFormParty" value="${transaction.party || ''}"></div><div class="input-field"><label for="transactionFormAnimalId">الحيوان المرتبط:</label><select id="transactionFormAnimalId"><option value="">-- لا يوجد --</option>${animalsHTML}</select></div><div class="input-field"><label for="transactionFormNotes">ملاحظات:</label><textarea id="transactionFormNotes" rows="2">${transaction.notes || ''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveTransaction'); if(transaction.relatedAnimalId) document.getElementById('transactionFormAnimalId').value = transaction.relatedAnimalId;}
function saveTransaction() { const transactionId = sfmCurrentlyEditingId; try{ const transactionData = { id: transactionId || generateUUID(), date: getStrVal('transactionFormDate', true), type: getSfmStrVal('transactionFormType'), description: getSfmStrVal('transactionFormDescription', true), amount: getSfmVal('transactionFormAmount'), party: getSfmStrVal('transactionFormParty'), relatedAnimalId: getSfmStrVal('transactionFormAnimalId') || null, notes: getSfmStrVal('transactionFormNotes') }; if(transactionData.amount <= 0) {showSfmAppNotification("المبلغ يجب أن يكون أكبر من صفر.","error"); return;} if(transactionData.type === 'sale' && transactionData.relatedAnimalId) { const animal = sfmData.animals.find(a => a.id === transactionData.relatedAnimalId); if (animal) animal.status = 'sold'; } if (transactionId) { const index = sfmData.transactions.findIndex(t => t.id === transactionId); if (index > -1) sfmData.transactions[index] = transactionData; } else { sfmData.transactions.push(transactionData); } saveSfmDataToLocalStorage(); renderTransactionList(); if(transactionData.type==='sale' && transactionData.relatedAnimalId) renderAnimalList(); closeSfmFormModal(); showSfmAppNotification("تم حفظ المعاملة.", "success"); } catch(e){return;}}
function renderTransactionList() { const tableBody = document.getElementById('transactionsTableBody'); const noMsg = document.getElementById('noTransactionsMessage'); if(!tableBody || !noMsg) return; const filterType = getStrVal('transactionFilterType'); const records = sfmData.transactions.filter(t => (filterType === 'all' || t.type === filterType)).sort((a,b) => new Date(b.date) - new Date(a.date)); if (records.length === 0) { tableBody.innerHTML = ''; noMsg.style.display = 'block'; return; } noMsg.style.display = 'none'; tableBody.innerHTML = records.map(t => `<tr><td>${sfmFormatDate(t.date)}</td><td>${getTransactionTypeText(t.type)}</td><td>${t.description}</td><td style="color:${t.type === 'sale' ? 'green' : (t.type === 'expense' || t.type === 'purchase' ? 'red' : 'inherit')}; font-weight:bold;">${sfmFormatCurrency(t.amount)}</td><td>${t.party || '-'}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openTransactionFormModal('${t.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('transactions', '${t.id}', renderTransactionList)">🗑️</button></td></tr>`).join('');}
function getTransactionTypeText(type){ const types = {sale:'بيع', purchase:'شراء', expense:'مصروف'}; return types[type] || type; }

function generateSfmReport(reportType) {
    const outputArea = document.getElementById('reportOutputArea'); if(!outputArea) return;
    let reportHTML = `<div style="padding:10px;"><h4 style="color:#1877f2; border-bottom:1px solid #ddd; padding-bottom:5px;">تقرير: ${getReportName(reportType)} (${sfmFormatDate(new Date())})</h4>`;
    if (reportType === 'flockSummary') { reportHTML += `<p>إجمالي الحيوانات: ${sfmData.animals.length}</p><p>النعاج: ${sfmData.animals.filter(a=>a.sex==='female' && !isAnimalLamb(a.birthDate)).length} | الكباش: ${sfmData.animals.filter(a=>a.sex==='male' && !isAnimalLamb(a.birthDate)).length} | الحملان: ${sfmData.animals.filter(a=>isAnimalLamb(a.birthDate)).length}</p><h5>توزيع السلالات:</h5><ul>`; const breeds = {}; sfmData.animals.forEach(a => breeds[a.breed] = (breeds[a.breed] || 0) + 1); for(const breed in breeds) reportHTML += `<li>${breed}: ${breeds[breed]}</li>`; reportHTML += '</ul>'; }
    else if (reportType === 'financialActuals') { const sales = sfmData.transactions.filter(t=>t.type === 'sale').reduce((sum,t)=> sum + t.amount, 0); const purchases = sfmData.transactions.filter(t=>t.type === 'purchase').reduce((sum,t)=> sum + t.amount, 0); const expenses = sfmData.transactions.filter(t=>t.type === 'expense').reduce((sum,t)=> sum + t.amount, 0); const netFlow = sales - purchases - expenses; reportHTML += `<table class="data-table"><tr><td>إجمالي المبيعات:</td><td>${sfmFormatCurrency(sales)}</td></tr><tr><td>إجمالي المشتريات:</td><td>${sfmFormatCurrency(purchases)}</td></tr><tr><td>إجمالي المصروفات الأخرى:</td><td>${sfmFormatCurrency(expenses)}</td></tr><tr style="font-weight:bold;"><td>صافي الربح/الخسارة (المسجل):</td><td style="color:${netFlow >=0 ? 'green':'red'};">${sfmFormatCurrency(netFlow)}</td></tr></table>`; }
    else if (reportType === 'growthPerformance') { reportHTML += '<h5>متوسط النمو اليومي (جم/يوم) للحملان (آخر فترة نمو مسجلة):</h5><ul>'; sfmData.animals.filter(a=>isAnimalLamb(a.birthDate, 12) && a.weightHistory && a.weightHistory.length >=2).forEach(lamb => { const wh = [...lamb.weightHistory].sort((a,b)=>new Date(a.date)-new Date(b.date)); const first = wh[0]; const last = wh[wh.length-1]; const days = (new Date(last.date) - new Date(first.date)) / (1000*60*60*24); if(days > 0 && last.weight > first.weight) { const adg = ((last.weight - first.weight) / days * 1000).toFixed(0); reportHTML += `<li>${lamb.tagId}: ${adg} جم/يوم (خلال ${Math.round(days)} يوم)</li>`;}}); reportHTML += '</ul>';}
    else if (reportType === 'equipmentMaintenance') { reportHTML += '<h5>سجل صيانة المعدات:</h5>'; if(sfmData.equipment.length === 0) {reportHTML += "<p>لا توجد معدات مسجلة.</p>"} else { sfmData.equipment.forEach(eq => { reportHTML += `<h6>${eq.name} (شراء: ${sfmFormatDate(eq.purchaseDate)}, تكلفة: ${sfmFormatCurrency(eq.cost)})</h6>`; if(eq.maintenanceLog && eq.maintenanceLog.length > 0){ reportHTML += '<ul>'; eq.maintenanceLog.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(log => { reportHTML += `<li>${sfmFormatDate(log.date)}: ${log.description} (تكلفة: ${sfmFormatCurrency(log.cost)})</li>`;}); reportHTML += '</ul>';} else {reportHTML += '<p><small>لا توجد سجلات صيانة.</small></p>';}});}}
    else { reportHTML += `<p class="alert-info">التقرير "${getReportName(reportType)}" قيد التطوير أو لا توجد بيانات كافية.</p>`; }
    reportHTML += `</div>`; outputArea.innerHTML = reportHTML;
}
function getReportName(type){ const names = {flockSummary: 'ملخص القطيع', breedingPerformance: 'أداء التناسل', healthSummary: 'ملخص صحي', feedConsumption:'استهلاك العلف', financialActuals:'الماليات الفعلية', inventoryStatus:'حالة المخزون', mortalityReport:'النفوق', cullingReport:'الاستبعاد', growthPerformance:'أداء النمو', equipmentMaintenance:'صيانة المعدات'}; return names[type] || type; }

function openEquipmentFormModal(equipmentId = null) { sfmCurrentlyEditingId = equipmentId; const equipment = equipmentId ? sfmData.equipment.find(eq => eq.id === equipmentId) : {}; const title = equipmentId ? "تعديل بيانات معدة" : "إضافة معدة جديدة"; const formHTML = `<div class="input-field"><label for="equipFormName">اسم المعدة:</label><input type="text" id="equipFormName" value="${equipment.name || ''}" required></div><div class="input-field"><label for="equipFormPurchaseDate">تاريخ الشراء:</label><input type="date" id="equipFormPurchaseDate" value="${equipment.purchaseDate || new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="equipFormCost">تكلفة الشراء:</label><input type="number" id="equipFormCost" value="${equipment.cost || 0}" inputmode="numeric"></div><div class="input-field"><label for="equipFormNotes">ملاحظات:</label><textarea id="equipFormNotes" rows="2">${equipment.notes || ''}</textarea></div>`; openSfmFormModal(title, formHTML, 'saveEquipment');}
function saveEquipment() { const equipmentId = sfmCurrentlyEditingId; try{ const equipmentData = { id: equipmentId || generateUUID(), name: getSfmStrVal('equipFormName', true), purchaseDate: getStrVal('equipFormPurchaseDate'), cost: getSfmVal('equipFormCost'), notes: getSfmStrVal('equipFormNotes'), maintenanceLog: equipmentId ? (sfmData.equipment.find(eq=>eq.id===equipmentId)?.maintenanceLog || []) : [] }; if(equipmentId){ const index = sfmData.equipment.findIndex(eq => eq.id === equipmentId); if(index > -1) sfmData.equipment[index] = equipmentData; } else { sfmData.equipment.push(equipmentData); } saveSfmDataToLocalStorage(); renderEquipmentList(); closeSfmFormModal(); showSfmAppNotification("تم حفظ بيانات المعدة.", "success"); } catch(e){return;}}
function renderEquipmentList() { const tableBody = document.getElementById('equipmentListTableBody'); const noMsg = document.getElementById('noEquipmentMessage'); if(!tableBody || !noMsg) return; const records = sfmData.equipment.sort((a,b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)); if(records.length === 0){ noMsg.style.display = 'block'; tableBody.innerHTML = ''; return; } noMsg.style.display = 'none'; tableBody.innerHTML = records.map(eq => { const lastMaint = eq.maintenanceLog && eq.maintenanceLog.length > 0 ? sfmFormatDate([...eq.maintenanceLog].sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date) : 'لا يوجد'; return `<tr><td>${eq.name}</td><td>${sfmFormatDate(eq.purchaseDate)}</td><td>${sfmFormatCurrency(eq.cost)}</td><td>${lastMaint}</td><td class="actions-cell"><button class="btn btn-sm btn-secondary" onclick="openEquipmentFormModal('${eq.id}')">✏️</button><button class="btn btn-sm btn-info" style="background-color:#17a2b8;" onclick="openMaintenanceLogFormModal('${eq.id}')">🛠️</button><button class="btn btn-sm btn-danger" onclick="deleteSfmItem('equipment','${eq.id}',renderEquipmentList)">🗑️</button></td></tr>`; }).join(''); }
function openMaintenanceLogFormModal(equipmentId){ sfmCurrentlyEditingId = equipmentId; const equipment = sfmData.equipment.find(eq=>eq.id === equipmentId); if(!equipment) return; const formHTML = `<h4>تسجيل صيانة لـ: ${equipment.name}</h4><div class="input-field"><label for="maintLogFormDate">تاريخ الصيانة:</label><input type="date" id="maintLogFormDate" value="${new Date().toISOString().split('T')[0]}"></div><div class="input-field"><label for="maintLogFormDescription">وصف الصيانة:</label><input type="text" id="maintLogFormDescription" required></div><div class="input-field"><label for="maintLogFormCost">تكلفة الصيانة:</label><input type="number" id="maintLogFormCost" value="0" inputmode="numeric"></div>`; openSfmFormModal(`تسجيل صيانة - ${equipment.name}`, formHTML, 'saveMaintenanceLog');}
function saveMaintenanceLog() { const equipmentId = sfmCurrentlyEditingId; const equipment = sfmData.equipment.find(eq => eq.id === equipmentId); if(!equipment) return; try { const logEntry = { date: getSfmStrVal('maintLogFormDate', true), description: getSfmStrVal('maintLogFormDescription', true), cost: getSfmVal('maintLogFormCost')}; if(!equipment.maintenanceLog) equipment.maintenanceLog = []; equipment.maintenanceLog.push(logEntry); saveSfmDataToLocalStorage(); renderEquipmentList(); closeSfmFormModal(); showSfmAppNotification("تم تسجيل الصيانة.", "success"); } catch(e){return;}}

function loadFarmSettingsToUI() { setSfmVal('farmNameSetting', sfmData.settings.farmName); setSfmVal('farmOwnerSetting', sfmData.settings.farmOwner); setSfmVal('defaultCurrencySetting', sfmData.settings.defaultCurrency); setSfmVal('customBreedsSetting', (sfmData.settings.customBreeds || []).join(', ')); setSfmVal('customFeedTypesSetting', (sfmData.settings.customFeedTypes || []).join(', ')); setSfmVal('photoUploadMaxSizeMBSetting', sfmData.settings.photoUploadMaxSizeMB || 2); setSfmVal('lowStockWarningPercentageSetting', sfmData.settings.lowStockWarningPercentage || 20); const farmNameTitle = document.getElementById('sfmFarmNameTitle'); if(farmNameTitle) farmNameTitle.textContent = `🐑 ${sfmData.settings.farmName || 'نظام إدارة مزرعة الأغنام'}`; }
function saveFarmSettings() { try{ sfmData.settings.farmName = getSfmStrVal('farmNameSetting', true); sfmData.settings.farmOwner = getSfmStrVal('farmOwnerSetting'); sfmData.settings.defaultCurrency = getSfmStrVal('defaultCurrencySetting', true) || 'ج.م'; sfmData.settings.photoUploadMaxSizeMB = getVal('photoUploadMaxSizeMBSetting') || 2; sfmData.settings.lowStockWarningPercentage = getVal('lowStockWarningPercentageSetting') || 20; saveSfmDataToLocalStorage(); showSfmAppNotification("تم حفظ الإعدادات.", "success"); document.getElementById('sfmFarmNameTitle').textContent = `🐑 ${sfmData.settings.farmName || 'نظام إدارة مزرعة الأغنام'}`;} catch(e){return;}}
function saveCustomTypes() { sfmData.settings.customBreeds = getSfmStrVal('customBreedsSetting').split(',').map(s=>s.trim()).filter(Boolean); sfmData.settings.customFeedTypes = getSfmStrVal('customFeedTypesSetting').split(',').map(s=>s.trim()).filter(Boolean); saveSfmDataToLocalStorage(); showSfmAppNotification("تم حفظ الأنواع المخصصة.", "success"); populateAnimalFilterDropdowns(); populateFeedRationSelect(); }

function backupSfmData() { try { const dataStr = JSON.stringify(sfmData, null, 2); const blob = new Blob([dataStr], {type: 'application/json;charset=utf-8'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; const farmNameSafe = (sfmData.settings.farmName || "FarmData").replace(/[^a-z0-9\u0600-\u06FF]/gi, '_').toLowerCase(); const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,''); link.download = `sfm_backup_${farmNameSafe}_${timestamp}.json`; link.click(); URL.revokeObjectURL(link.href); showSfmAppNotification("تم إنشاء نسخة احتياطية!", "success"); } catch (e) { console.error("Backup error:", e); showSfmAppNotification("فشل إنشاء النسخة الاحتياطية.", "error"); } }
function restoreSfmData(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const restoredData = JSON.parse(e.target.result); if (restoredData && restoredData.animals !== undefined && restoredData.settings !== undefined) { sfmData = {...createDefaultSfmData(), ...restoredData, settings: {...createDefaultSfmData().settings, ...(restoredData.settings || {})}}; saveSfmDataToLocalStorage(); showSfmAppNotification("تم استعادة البيانات! يتم تحديث الواجهة...", "success"); setTimeout(() => { sfmIsInitialAppLoad = true; navigateToSfmSection('dashboard'); refreshAllSfmDataViews(); }, 500); } else { showSfmAppNotification("الملف غير صالح.", "error");} } catch (err) { console.error("Error restoring data:", err); showSfmAppNotification("فشل استعادة البيانات.", "error"); }}; reader.readAsText(file, "UTF-8"); event.target.value = null; }
function confirmClearAllData() { if (confirm("هل أنت متأكد من مسح جميع بيانات المزرعة؟ لا يمكن التراجع عن هذا!")) { sfmData = createDefaultSfmData(); saveSfmDataToLocalStorage(); showSfmAppNotification("تم مسح جميع البيانات.", "warn"); sfmIsInitialAppLoad = true; navigateToSfmSection('dashboard'); refreshAllSfmDataViews(); } }

function handleSfmFabClick(){ switch(currentSfmSectionId){ case 'animalManagement': openAnimalFormModal(null); break; case 'breedingManagement': openMatingFormModal(null); break; case 'healthManagement': openHealthRecordFormModal(null); break; case 'inventoryManagement': openInventoryItemFormModal(null); break; case 'taskManagement': openTaskFormModal(null); break; case 'salesPurchases': openTransactionFormModal(null, 'sale'); break; case 'feedingManagement': openFeedRationFormModal(null); break; case 'settings': openEquipmentFormModal(null); break; default: showSfmAppNotification("اختر قسمًا لإضافة سجل جديد.", "info"); break;}}
function deleteSfmItem(itemTypeKey, itemId, renderCallback) { if (confirm("هل أنت متأكد من حذف هذا السجل؟")) { if(sfmData[itemTypeKey] && Array.isArray(sfmData[itemTypeKey])) { sfmData[itemTypeKey] = sfmData[itemTypeKey].filter(item => item.id !== itemId); saveSfmDataToLocalStorage(); if(renderCallback && typeof renderCallback === 'function') renderCallback(); renderDashboard(); showSfmAppNotification("تم الحذف بنجاح.", "success"); } else { showSfmAppNotification("نوع السجل غير معروف للحذف.", "error"); } } }
function syncSfmData() { showSfmAppNotification("ميزة المزامنة مع السحابة قيد التطوير.", "info"); }

if (typeof Chart !== 'undefined') { Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif"; Chart.defaults.font.size = 11; Chart.defaults.color = '#606770'; Chart.defaults.plugins.legend.position = 'bottom'; Chart.defaults.plugins.tooltip.rtl = true; Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' }; Chart.defaults.plugins.title.display = true; Chart.defaults.plugins.title.color = '#050505'; Chart.defaults.plugins.title.font = { weight: '600', size: 14}; }
