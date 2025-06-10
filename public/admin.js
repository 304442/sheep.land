// Comprehensive Admin System for Sheep.land
const adminSystem = {
    // Initialize admin system
    init() {
        console.log('🐑 Admin System: Initializing...');
        console.log('🐑 Admin System: Current URL hash:', window.location.hash);
        // Remove any existing admin panels (but not the top bars from feedback system)
        document.querySelectorAll('.main-admin-panel').forEach(el => el.remove());
        
        this.setupMainAdminPanel();
        // this.loadDashboardData(); // Removed - function doesn't exist yet
        console.log('🐑 Admin System: Initialization complete');
    },

    // Check if user is authenticated as admin
    checkAdminAuth() {
        // Check PocketBase auth first
        if (window.pb && window.pb.authStore.isValid) {
            const user = window.pb.authStore.record;
            // Check if user has admin field set to true
            if (user?.is_admin === true || user?.admin === true || user?.isAdmin === true) {
                console.log('🐑 Admin System: User is admin');
                return true;
            }
            // Check for specific admin email addresses (you can customize this list)
            const adminEmails = ['admin@sheep.land', 'admin@example.com'];
            if (adminEmails.includes(user?.email)) {
                console.log('🐑 Admin System: User has admin email');
                return true;
            }
        }
        
        // Fallback to hash or localStorage for testing
        const isAdminMode = window.location.hash.includes('admin') || localStorage.getItem('admin_mode') === 'true';
        console.log('🐑 Admin System: Fallback admin mode check:', isAdminMode);
        return isAdminMode;
    },

    // Create main admin interface
    setupMainAdminPanel() {
        // Check if admin mode should be enabled
        const hasAdminHash = window.location.hash.includes('admin');
        const hasAdminStorage = localStorage.getItem('admin_mode') === 'true';
        const isAdminMode = hasAdminHash || hasAdminStorage;
        
        console.log('🐑 Admin System: Admin mode check:', isAdminMode);
        console.log('🐑 Admin System: Hash check:', hasAdminHash);
        console.log('🐑 Admin System: LocalStorage check:', hasAdminStorage);
        
        if (isAdminMode) {
            console.log('🐑 Admin System: Admin mode detected');
            
            // Check if user is authenticated as admin
            if (window.pb && window.pb.authStore.isValid) {
                const user = window.pb.authStore.record;
                const adminEmails = ['admin@sheep.land', 'admin@example.com'];
                
                if (user?.is_admin === true || user?.admin === true || user?.isAdmin === true || adminEmails.includes(user?.email)) {
                    console.log('🐑 Admin System: User is authenticated admin, creating panel...');
                    this.createAdminPanel();
                } else {
                    console.log('🐑 Admin System: User authenticated but not admin, showing login prompt...');
                    this.showAdminLoginPrompt();
                }
            } else {
                console.log('🐑 Admin System: No authentication, showing login prompt...');
                this.showAdminLoginPrompt();
            }
        } else {
            console.log('🐑 Admin System: Admin mode not enabled, skipping panel creation');
        }
    },

    // Create the actual admin panel
    createAdminPanel() {
        // Add admin class to body for styling adjustments
        document.body.classList.add('admin-mode');
        
        // Create admin top bar (not floating panel)
        const adminBar = document.createElement('div');
        adminBar.className = 'admin-top-bar main-admin-bar';
        adminBar.innerHTML = `
            <div class="admin-bar-content">
                <div class="admin-bar-label">
                    <span>🛡️ Admin Dashboard</span>
                </div>
                <div class="admin-bar-actions">
                    <button onclick="adminSystem.showDashboard()" class="admin-bar-btn" title="Dashboard">
                        <span class="admin-btn-icon">📊</span>
                        <span class="admin-btn-text">Dashboard</span>
                    </button>
                    <button onclick="adminSystem.showOrdersManager()" class="admin-bar-btn" title="Orders">
                        <span class="admin-btn-icon">📦</span>
                        <span class="admin-btn-text">Orders</span>
                    </button>
                    <button onclick="adminSystem.showProductsManager()" class="admin-bar-btn" title="Products">
                        <span class="admin-btn-icon">🛍️</span>
                        <span class="admin-btn-text">Products</span>
                    </button>
                    <button onclick="adminSystem.showUsersManager()" class="admin-bar-btn" title="Users">
                        <span class="admin-btn-icon">👥</span>
                        <span class="admin-btn-text">Users</span>
                    </button>
                    <button onclick="adminSystem.showSettings()" class="admin-bar-btn" title="Settings">
                        <span class="admin-btn-icon">⚙️</span>
                        <span class="admin-btn-text">Settings</span>
                    </button>
                    <button onclick="adminSystem.toggleAdminMode()" class="admin-bar-btn admin-bar-close" title="Exit Admin">
                        <span class="admin-btn-icon">❌</span>
                        <span class="admin-btn-text">Exit</span>
                    </button>
                </div>
            </div>
        `;
        document.body.insertBefore(adminBar, document.body.firstChild);
        
        // Create admin modal container
        this.createAdminModal();
        
        console.log('🐑 Admin System: Admin bar created successfully');
    },
    
    // Create modal for admin content
    createAdminModal() {
        // Remove any existing admin modals
        const existingModal = document.getElementById('adminModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div id="adminModal" class="admin-modal" style="display: none;">
                <div class="admin-modal-overlay" onclick="adminSystem.closeAdminModal()"></div>
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h2 id="adminModalTitle">Admin Panel</h2>
                        <button class="admin-modal-close" onclick="adminSystem.closeAdminModal()">×</button>
                    </div>
                    <div class="admin-modal-body" id="adminModalContent">
                        <!-- Dynamic content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add modal styles if not already present
        if (!document.querySelector('#adminModalStyles')) {
            const styles = `
                <style id="adminModalStyles">
                    .admin-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 10000;
                    }
                    
                    .admin-modal-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                    }
                    
                    .admin-modal-content {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        width: 90%;
                        max-width: 1200px;
                        max-height: 90vh;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .admin-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .admin-modal-header h2 {
                        margin: 0;
                        font-size: 24px;
                        color: #333;
                    }
                    
                    .admin-modal-close {
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .admin-modal-close:hover {
                        color: #000;
                    }
                    
                    .admin-modal-body {
                        padding: 20px;
                        overflow-y: auto;
                        flex: 1;
                    }
                    
                    /* Admin table styles */
                    .admin-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    
                    .admin-table th,
                    .admin-table td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .admin-table th {
                        background: #f8f9fa;
                        font-weight: 600;
                        color: #333;
                    }
                    
                    .admin-table tr:hover {
                        background: #f8f9fa;
                    }
                    
                    /* Section headers */
                    .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    
                    /* Status badges */
                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    
                    .status-badge.status-pending {
                        background: #fff3cd;
                        color: #856404;
                    }
                    
                    .status-badge.status-processing {
                        background: #cce5ff;
                        color: #004085;
                    }
                    
                    .status-badge.status-delivered {
                        background: #d4edda;
                        color: #155724;
                    }
                    
                    .status-badge.status-active {
                        background: #d4edda;
                        color: #155724;
                    }
                    
                    .status-badge.status-inactive {
                        background: #f8d7da;
                        color: #721c24;
                    }
                    
                    /* Stat badges */
                    .stat-badge {
                        padding: 6px 12px;
                        background: #e9ecef;
                        border-radius: 4px;
                        margin-right: 10px;
                        font-size: 14px;
                    }
                    
                    .stat-badge.pending {
                        background: #fff3cd;
                        color: #856404;
                    }
                    
                    .stat-badge.processing {
                        background: #cce5ff;
                        color: #004085;
                    }
                    
                    .stat-badge.delivered {
                        background: #d4edda;
                        color: #155724;
                    }
                    
                    /* Small buttons */
                    .btn-small {
                        padding: 4px 8px;
                        font-size: 12px;
                        border: none;
                        background: #007bff;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 4px;
                    }
                    
                    .btn-small:hover {
                        background: #0056b3;
                    }
                    
                    .btn-small.danger {
                        background: #dc3545;
                    }
                    
                    .btn-small.danger:hover {
                        background: #c82333;
                    }
                    
                    .btn-small.success {
                        background: #28a745;
                    }
                    
                    .btn-small.success:hover {
                        background: #218838;
                    }
                    
                    /* Products grid */
                    .products-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    
                    .product-card {
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    .product-card img {
                        width: 100%;
                        height: 200px;
                        object-fit: cover;
                    }
                    
                    .product-info {
                        padding: 15px;
                    }
                    
                    .product-info h3 {
                        margin: 0 0 10px 0;
                        font-size: 18px;
                    }
                    
                    .product-category {
                        color: #666;
                        font-size: 14px;
                        margin: 5px 0;
                    }
                    
                    .product-price {
                        font-size: 18px;
                        font-weight: bold;
                        color: #007bff;
                        margin: 5px 0;
                    }
                    
                    .product-stock {
                        font-size: 14px;
                        color: #666;
                    }
                    
                    .product-actions {
                        margin-top: 10px;
                    }
                    
                    /* Settings forms */
                    .settings-section {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    
                    .settings-section h3 {
                        margin-top: 0;
                        margin-bottom: 15px;
                        color: #333;
                    }
                    
                    .form-group {
                        margin-bottom: 15px;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: 500;
                        color: #333;
                    }
                    
                    .form-control {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid #ced4da;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    
                    .checkbox-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: normal;
                    }
                    
                    .checkbox-group input[type="checkbox"] {
                        margin-right: 8px;
                    }
                    
                    /* Dashboard styles */
                    .admin-dashboard h2 {
                        margin-bottom: 20px;
                    }
                    
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .metric-card {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    
                    .metric-icon {
                        font-size: 32px;
                    }
                    
                    .metric-info h3 {
                        margin: 0;
                        font-size: 14px;
                        color: #666;
                    }
                    
                    .metric-value {
                        margin: 5px 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .metric-change {
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .metric-change.positive {
                        color: #28a745;
                    }
                    
                    .metric-change.warning {
                        color: #ffc107;
                    }
                    
                    .quick-actions,
                    .recent-activity {
                        margin-bottom: 30px;
                    }
                    
                    .action-buttons {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-top: 15px;
                    }
                    
                    .action-btn {
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    
                    .action-btn:hover {
                        background: #0056b3;
                    }
                    
                    .activity-list {
                        margin-top: 15px;
                    }
                    
                    .activity-item {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        padding: 10px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .activity-item:last-child {
                        border-bottom: none;
                    }
                    
                    .activity-icon {
                        font-size: 24px;
                    }
                    
                    .activity-details {
                        flex: 1;
                    }
                    
                    .activity-text {
                        margin: 0;
                        color: #333;
                    }
                    
                    .activity-time {
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .admin-alerts {
                        margin-top: 20px;
                    }
                    
                    .alert {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 12px;
                        border-radius: 4px;
                        margin-bottom: 10px;
                    }
                    
                    .alert-warning {
                        background: #fff3cd;
                        color: #856404;
                    }
                    
                    .alert-info {
                        background: #cce5ff;
                        color: #004085;
                    }
                    
                    .alert-dismiss {
                        margin-left: auto;
                        background: none;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                        color: inherit;
                        opacity: 0.5;
                    }
                    
                    .alert-dismiss:hover {
                        opacity: 1;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    },
    
    // Show admin modal with content
    showAdminModal(title, content) {
        // Call the createAdminModal function with the parameters
        this.createAdminModal(title, content);
    },
    
    // Legacy showAdminModal for compatibility
    OLD_showAdminModal(title, content) {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('adminModalTitle');
        const modalContent = document.getElementById('adminModalContent');
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = title;
            modalContent.innerHTML = content;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }
    },
    
    // Close admin modal
    closeAdminModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore body scroll
        }
    },
    
    // Old floating panel code removed - keeping for reference
    OLD_createAdminPanel() {
        const adminPanel = document.createElement('div');
        adminPanel.innerHTML = `
            <div class="admin-toggle" onclick="adminSystem.toggleAdminPanel()" style="
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 12px 20px;
                cursor: pointer;
                border-radius: 6px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
                border: none;
                min-width: 120px;
                justify-content: center;
            ">
                <span>👑 Admin Panel</span>
            </div>
                <div class="admin-content" id="mainAdminContent" style="
                    display:none;
                    background: white;
                    width: 800px;
                    max-height: 600px;
                    overflow-y: auto;
                    border-top: 1px solid #e0e0e0;
                    border-radius: 0 0 6px 6px;
                ">
                    <div class="admin-nav" style="
                        display: flex;
                        flex-wrap: wrap;
                        background: #f8f9fa;
                        padding: 10px;
                        gap: 5px;
                        border-bottom: 1px solid #e0e0e0;
                    ">
                        <button onclick="adminSystem.showDashboard()" class="admin-nav-btn active" data-tab="dashboard">
                            📊 Dashboard
                        </button>
                        <button onclick="adminSystem.showOrderManager()" class="admin-nav-btn" data-tab="orders">
                            📦 Orders
                        </button>
                        <button onclick="adminSystem.showProductManager()" class="admin-nav-btn" data-tab="products">
                            🐑 Products
                        </button>
                        <button onclick="adminSystem.showCustomerManager()" class="admin-nav-btn" data-tab="customers">
                            👥 Customers
                        </button>
                        <button onclick="adminSystem.showInventoryManager()" class="admin-nav-btn" data-tab="inventory">
                            📋 Inventory
                        </button>
                        <button onclick="adminSystem.showAnalytics()" class="admin-nav-btn" data-tab="analytics">
                            📈 Analytics
                        </button>
                        <button onclick="adminSystem.showSettings()" class="admin-nav-btn" data-tab="settings">
                            ⚙️ Settings
                        </button>
                        <button onclick="feedbackSystem.showDashboard()" class="admin-nav-btn" data-tab="feedback">
                            💬 Feedback
                        </button>
                        <button onclick="adminSystem.showLivestockManager()" class="admin-nav-btn" data-tab="livestock">
                            🐑 Livestock
                        </button>
                        <button onclick="adminSystem.showFarmOperations()" class="admin-nav-btn" data-tab="farm">
                            🚜 Farm Ops
                        </button>
                        <button onclick="adminSystem.showFinancialManager()" class="admin-nav-btn" data-tab="financial">
                            💰 Financials
                        </button>
                        <button onclick="adminSystem.showBusinessReports()" class="admin-nav-btn" data-tab="reports">
                            📊 Reports
                        </button>
                        <button onclick="adminSystem.showSupplierManager()" class="admin-nav-btn" data-tab="suppliers">
                            🏪 Suppliers
                        </button>
                        <button onclick="adminSystem.showFarmCalendar()" class="admin-nav-btn" data-tab="calendar">
                            📅 Calendar
                        </button>
                    </div>
                    <div class="admin-main-content" id="adminMainContent" style="
                        padding: 20px;
                        background: white;
                        min-height: 400px;
                    ">
                        <!-- Dynamic content will be loaded here -->
                    </div>
                </div>
            `;
            document.body.appendChild(adminPanel);
            
            // Add styles for admin navigation buttons
            const adminStyles = document.createElement('style');
            adminStyles.textContent = `
                .admin-nav-btn {
                    padding: 8px 12px !important;
                    border: none !important;
                    background: #6c757d !important;
                    color: white !important;
                    border-radius: 4px !important;
                    cursor: pointer !important;
                    font-size: 12px !important;
                    white-space: nowrap !important;
                    transition: background 0.2s !important;
                }
                .admin-nav-btn:hover {
                    background: #5a6268 !important;
                }
                .admin-nav-btn.active {
                    background: #007bff !important;
                }
                .admin-nav-btn.active:hover {
                    background: #0056b3 !important;
                }
            `;
            document.head.appendChild(adminStyles);
            
            console.log('🐑 Admin System: Admin panel added to DOM');
    },

    // Show admin login prompt
    showAdminLoginPrompt() {
        console.log('🐑 Admin System: Creating admin login prompt bar...');
        
        // Remove any existing admin bars first
        document.querySelectorAll('.admin-top-bar, .admin-login-bar').forEach(el => el.remove());
        
        // Add admin class to body for styling adjustments
        document.body.classList.add('admin-mode');
        
        const adminBar = document.createElement('div');
        adminBar.className = 'admin-top-bar admin-login-bar';
        adminBar.innerHTML = `
            <div class="admin-bar-content">
                <div class="admin-bar-label">
                    <span>🔒 Admin Access Required</span>
                </div>
                <div class="admin-bar-actions">
                    <span style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-right: 15px;">Please login to access the admin panel</span>
                    <button onclick="document.querySelector('.admin-login-bar')?.remove(); document.body.classList.remove('admin-mode'); const app = document.querySelector('[x-data]')._x_dataStack[0]; app.showAuthDropdown = true; app.auth.view = 'login';" class="admin-bar-btn" style="background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4);">
                        <span class="admin-btn-icon">🔑</span>
                        <span class="admin-btn-text">Login as Admin</span>
                    </button>
                    <button onclick="document.querySelector('.admin-login-bar')?.remove(); document.body.classList.remove('admin-mode'); window.location.hash = '';" class="admin-bar-btn admin-bar-close" title="Cancel">
                        <span class="admin-btn-icon">❌</span>
                        <span class="admin-btn-text">Cancel</span>
                    </button>
                </div>
            </div>
        `;
        document.body.insertBefore(adminBar, document.body.firstChild);
        console.log('🐑 Admin System: Admin login bar created');
    },

    // Toggle admin panel visibility
    toggleAdminPanel() {
        const content = document.getElementById('mainAdminContent');
        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.showDashboard(); // Show dashboard by default
        }
    },

    // Set active navigation (no longer needed with modal approach)
    setActiveNav(tab) {
        // This function is kept for compatibility but does nothing
        // since we're using modals instead of the old panel navigation
    },

    // Show main dashboard
    // Create admin modal for displaying content
    createAdminModal(title, content) {
        // Remove any existing modal
        document.querySelector('.admin-modal-overlay')?.remove();
        
        const modal = document.createElement('div');
        modal.className = 'admin-modal-overlay';
        modal.innerHTML = `
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <h2>${title}</h2>
                    <button onclick="adminSystem.closeAdminModal()" class="admin-modal-close">&times;</button>
                </div>
                <div class="admin-modal-content">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeAdminModal();
            }
        });
    },
    
    // Close admin modal
    closeAdminModal() {
        document.querySelector('.admin-modal-overlay')?.remove();
    },
    
    showDashboard() {
        const dashboardData = this.getDashboardData();
        
        const content = `
            <div class="admin-dashboard">
                <h2>Business Overview</h2>
                
                <!-- Key Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">💰</div>
                        <div class="metric-info">
                            <h3>Today's Sales</h3>
                            <p class="metric-value">$${dashboardData.todaySales}</p>
                            <span class="metric-change positive">+12% vs yesterday</span>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">📦</div>
                        <div class="metric-info">
                            <h3>Pending Orders</h3>
                            <p class="metric-value">${dashboardData.pendingOrders}</p>
                            <span class="metric-change">Need attention</span>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">🐑</div>
                        <div class="metric-info">
                            <h3>Low Stock Items</h3>
                            <p class="metric-value">${dashboardData.lowStockItems}</p>
                            <span class="metric-change warning">Reorder needed</span>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">⭐</div>
                        <div class="metric-info">
                            <h3>Customer Satisfaction</h3>
                            <p class="metric-value">${dashboardData.satisfaction}%</p>
                            <span class="metric-change positive">+5% this month</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-buttons">
                        <button onclick="adminSystem.addNewProduct()" class="action-btn">
                            ➕ Add Product
                        </button>
                        <button onclick="adminSystem.processOrders()" class="action-btn">
                            📋 Process Orders
                        </button>
                        <button onclick="adminSystem.updateInventory()" class="action-btn">
                            📦 Update Stock
                        </button>
                        <button onclick="feedbackSystem.showLinkGenerator()" class="action-btn">
                            📧 Send Feedback Request
                        </button>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <h3>Recent Activity</h3>
                    <div class="activity-list">
                        ${dashboardData.recentActivity.map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon">${activity.icon}</div>
                                <div class="activity-details">
                                    <p class="activity-text">${activity.text}</p>
                                    <span class="activity-time">${activity.time}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Alerts -->
                ${dashboardData.alerts.length > 0 ? `
                <div class="admin-alerts">
                    <h3>🚨 Alerts</h3>
                    ${dashboardData.alerts.map(alert => `
                        <div class="alert alert-${alert.type}">
                            <span class="alert-icon">${alert.icon}</span>
                            <span class="alert-text">${alert.text}</span>
                            <button onclick="adminSystem.dismissAlert('${alert.id}')" class="alert-dismiss">×</button>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
        
        this.showAdminModal('Dashboard', content);
    },
    
    // Show orders manager (for top bar)
    showOrdersManager() {
        const ordersData = this.getOrdersData();
        
        const content = `
            <div class="admin-orders">
                <div class="section-header">
                    <h2>Order Management</h2>
                    <div class="order-stats">
                        <span class="stat-badge">Total: ${ordersData.total}</span>
                        <span class="stat-badge pending">Pending: ${ordersData.pending}</span>
                        <span class="stat-badge processing">Processing: ${ordersData.processing}</span>
                        <span class="stat-badge delivered">Delivered: ${ordersData.delivered}</span>
                    </div>
                </div>
                
                <div class="orders-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Products</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordersData.orders.map(order => `
                                <tr>
                                    <td>#${order.id}</td>
                                    <td>${order.customerName}</td>
                                    <td>${order.products}</td>
                                    <td>${order.total} EGP</td>
                                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                                    <td>${order.date}</td>
                                    <td>
                                        <button onclick="adminSystem.viewOrder('${order.id}')" class="btn-small">View</button>
                                        <button onclick="adminSystem.updateOrderStatus('${order.id}')" class="btn-small">Update</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.showAdminModal('Orders Management', content);
    },
    
    // Show products manager (for top bar)
    showProductsManager() {
        const productsData = this.getProductsData();
        
        const content = `
            <div class="admin-products">
                <div class="section-header">
                    <h2>Product Management</h2>
                    <button onclick="adminSystem.addNewProduct()" class="btn bp">+ Add New Product</button>
                </div>
                
                <div class="products-grid">
                    ${productsData.products.map(product => `
                        <div class="product-card">
                            <img src="${product.image}" alt="${product.name}">
                            <div class="product-info">
                                <h3>${product.name}</h3>
                                <p class="product-category">${product.category}</p>
                                <p class="product-price">${product.price} EGP</p>
                                <p class="product-stock">Stock: ${product.stock}</p>
                                <div class="product-actions">
                                    <button onclick="adminSystem.editProduct('${product.id}')" class="btn-small">Edit</button>
                                    <button onclick="adminSystem.updateStock('${product.id}')" class="btn-small">Update Stock</button>
                                    <button onclick="adminSystem.toggleProductStatus('${product.id}')" class="btn-small ${product.active ? 'danger' : 'success'}">
                                        ${product.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.showAdminModal('Products Management', content);
    },
    
    // Show users manager (for top bar)
    showUsersManager() {
        const usersData = this.getUsersData();
        
        const content = `
            <div class="admin-users">
                <div class="section-header">
                    <h2>User Management</h2>
                    <div class="user-stats">
                        <span class="stat-badge">Total Users: ${usersData.total}</span>
                        <span class="stat-badge">Active Today: ${usersData.activeToday}</span>
                        <span class="stat-badge">New This Month: ${usersData.newThisMonth}</span>
                    </div>
                </div>
                
                <div class="users-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usersData.users.map(user => `
                                <tr>
                                    <td>#${user.id}</td>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td>${user.phone}</td>
                                    <td>${user.orderCount}</td>
                                    <td>${user.totalSpent} EGP</td>
                                    <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                                    <td>${user.joinDate}</td>
                                    <td>
                                        <button onclick="adminSystem.viewUser('${user.id}')" class="btn-small">View</button>
                                        <button onclick="adminSystem.contactUser('${user.id}')" class="btn-small">Contact</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.showAdminModal('Users Management', content);
    },

    // Show order management
    showOrderManager() {
        this.setActiveNav('orders');
        const content = document.getElementById('adminMainContent');
        const orders = this.getOrdersData();
        
        content.innerHTML = `
            <div class="admin-orders">
                <div class="section-header">
                    <h2>Order Management</h2>
                    <div class="order-filters">
                        <select id="orderStatusFilter" onchange="adminSystem.filterOrders()">
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input type="date" id="orderDateFilter" onchange="adminSystem.filterOrders()">
                        <input type="text" id="orderSearchFilter" placeholder="Search orders..." onkeyup="adminSystem.filterOrders()">
                    </div>
                </div>
                
                <div class="orders-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Orders:</span>
                        <span class="stat-value">${orders.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pending:</span>
                        <span class="stat-value">${orders.filter(o => o.status === 'pending').length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Today's Revenue:</span>
                        <span class="stat-value">$${orders.filter(o => this.isToday(o.date)).reduce((sum, o) => sum + o.total, 0)}</span>
                    </div>
                </div>

                <div class="orders-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ordersTableBody">
                            ${orders.map(order => `
                                <tr class="order-row" data-status="${order.status}">
                                    <td class="order-id">${order.id}</td>
                                    <td>
                                        <div class="customer-info">
                                            <strong>${order.customer.name}</strong>
                                            <br><small>${order.customer.phone}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="order-items">
                                            ${order.items.slice(0, 2).map(item => `
                                                <span class="item-badge">${item.quantity}x ${item.name}</span>
                                            `).join('')}
                                            ${order.items.length > 2 ? `<span class="more-items">+${order.items.length - 2} more</span>` : ''}
                                        </div>
                                    </td>
                                    <td class="order-total">$${order.total}</td>
                                    <td>
                                        <span class="status-badge status-${order.status}">${order.status}</span>
                                    </td>
                                    <td>${new Date(order.date).toLocaleDateString()}</td>
                                    <td class="order-actions">
                                        <button onclick="adminSystem.viewOrder('${order.id}')" class="btn-sm">👁️ View</button>
                                        <button onclick="adminSystem.updateOrderStatus('${order.id}')" class="btn-sm">📝 Update</button>
                                        ${order.status === 'pending' ? `<button onclick="adminSystem.confirmOrder('${order.id}')" class="btn-sm success">✅ Confirm</button>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Show product management
    showProductManager() {
        this.setActiveNav('products');
        const content = document.getElementById('adminMainContent');
        const products = this.getProductsData();
        
        content.innerHTML = `
            <div class="admin-products">
                <div class="section-header">
                    <h2>Product Management</h2>
                    <button onclick="adminSystem.addNewProduct()" class="btn-primary">➕ Add New Product</button>
                </div>
                
                <div class="product-filters">
                    <select id="productCategoryFilter" onchange="adminSystem.filterProducts()">
                        <option value="">All Categories</option>
                        <option value="udheya">Udheya</option>
                        <option value="livesheep_general">Live Sheep</option>
                        <option value="meat_cuts">Meat Cuts</option>
                        <option value="gathering_package">Gathering Packages</option>
                    </select>
                    <select id="productStatusFilter" onchange="adminSystem.filterProducts()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                    <input type="text" id="productSearchFilter" placeholder="Search products..." onkeyup="adminSystem.filterProducts()">
                </div>

                <div class="products-grid">
                    ${products.map(product => `
                        <div class="product-card" data-category="${product.category}" data-status="${product.status}">
                            <div class="product-image">
                                <img src="${product.image}" alt="${product.name}" loading="lazy">
                                <div class="product-status-badge status-${product.status}">${product.status}</div>
                            </div>
                            <div class="product-info">
                                <h4 class="product-name">${product.name}</h4>
                                <p class="product-category">${product.category}</p>
                                <div class="product-details">
                                    <span class="product-price">$${product.price}</span>
                                    <span class="product-stock">Stock: ${product.stock}</span>
                                </div>
                                <div class="product-actions">
                                    <button onclick="adminSystem.editProduct('${product.id}')" class="btn-sm">✏️ Edit</button>
                                    <button onclick="adminSystem.toggleProductStatus('${product.id}')" class="btn-sm">
                                        ${product.status === 'active' ? '🚫 Disable' : '✅ Enable'}
                                    </button>
                                    <button onclick="adminSystem.updateStock('${product.id}')" class="btn-sm">📦 Stock</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Get dashboard data
    getDashboardData() {
        // In a real app, this would fetch from your database
        // For now, we'll use localStorage and mock data
        const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        const feedback = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
        
        const todayOrders = orders.filter(o => this.isToday(o.date));
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        
        return {
            todaySales: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2),
            pendingOrders: pendingOrders,
            lowStockItems: 3, // Mock data
            satisfaction: feedback.length > 0 ? Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length / 5) * 100) : 85,
            recentActivity: [
                { icon: '📦', text: 'New order #12345 received', time: '5 minutes ago' },
                { icon: '⭐', text: 'Customer left 5-star review', time: '1 hour ago' },
                { icon: '🐑', text: 'Sheep inventory updated', time: '2 hours ago' },
                { icon: '💰', text: 'Payment confirmed for order #12344', time: '3 hours ago' }
            ],
            alerts: [
                { id: 'stock1', type: 'warning', icon: '⚠️', text: 'Premium Udheya sheep running low (only 2 left)' },
                { id: 'order1', type: 'info', icon: 'ℹ️', text: '5 orders pending confirmation' }
            ]
        };
    },

    // Get orders data (mock for now)
    getOrdersData() {
        const stored = localStorage.getItem('admin_orders');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Mock orders data
        const mockOrders = [
            {
                id: 'ORD-12345',
                customer: { name: 'Ahmed Hassan', phone: '+20123456789', email: 'ahmed@email.com' },
                items: [
                    { name: 'Premium Udheya Sheep', quantity: 1, price: 250 },
                    { name: 'Fresh Meat Package', quantity: 2, price: 80 }
                ],
                total: 410,
                status: 'pending',
                date: new Date().toISOString(),
                paymentMethod: 'cash',
                deliveryAddress: 'Cairo, Egypt'
            },
            {
                id: 'ORD-12344',
                customer: { name: 'Fatima Ali', phone: '+20123456788', email: 'fatima@email.com' },
                items: [
                    { name: 'Live Sheep', quantity: 1, price: 200 }
                ],
                total: 200,
                status: 'confirmed',
                date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                paymentMethod: 'online',
                deliveryAddress: 'Alexandria, Egypt'
            }
        ];
        
        localStorage.setItem('admin_orders', JSON.stringify(mockOrders));
        return mockOrders;
    },

    // Get products data (mock for now)
    getProductsData() {
        const stored = localStorage.getItem('admin_products');
        if (stored) {
            const data = JSON.parse(stored);
            // Handle old format (array) vs new format (object with products array)
            if (Array.isArray(data)) {
                return {
                    products: data,
                    total: data.length,
                    categories: [...new Set(data.map(p => p.category))].length
                };
            }
            return data;
        }
        
        // Mock products data
        const mockProducts = [
            {
                id: 'prod-1',
                name: 'Premium Udheya Sheep',
                category: 'udheya',
                price: 250,
                stock: 15,
                status: 'active',
                image: 'images/products/sheep-field.jpg',
                description: 'Premium quality sheep for Udheya'
            },
            {
                id: 'prod-2',
                name: 'Fresh Meat Package',
                category: 'meat_cuts',
                price: 80,
                stock: 25,
                status: 'active',
                image: 'images/products/sheep-field.jpg',
                description: 'Fresh cuts of premium meat'
            },
            {
                id: 'prod-3',
                name: 'Live Sheep',
                category: 'livesheep_general',
                price: 200,
                stock: 2,
                status: 'active',
                image: 'images/products/sheep-field.jpg',
                description: 'High quality live sheep'
            }
        ];
        
        const productsData = {
            products: mockProducts,
            total: mockProducts.length,
            categories: [...new Set(mockProducts.map(p => p.category))].length
        };
        
        localStorage.setItem('admin_products', JSON.stringify(productsData));
        return productsData;
    },
    
    // Get users data (mock for now)
    getUsersData() {
        // Check localStorage first
        const storedUsers = localStorage.getItem('admin_users');
        if (storedUsers) {
            const users = JSON.parse(storedUsers);
            return {
                total: users.length,
                activeToday: users.filter(u => u.lastActive === new Date().toISOString().split('T')[0]).length,
                newThisMonth: users.filter(u => {
                    const joinDate = new Date(u.joinDate);
                    const now = new Date();
                    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                }).length,
                users: users
            };
        }
        
        // Mock data
        const mockUsers = [
            {
                id: '1',
                name: 'Ahmed Hassan',
                email: 'ahmed@example.com',
                phone: '+20 10 1234 5678',
                orderCount: 5,
                totalSpent: 15000,
                status: 'active',
                joinDate: '2024-01-15',
                lastActive: new Date().toISOString().split('T')[0]
            },
            {
                id: '2',
                name: 'Fatima Ali',
                email: 'fatima@example.com',
                phone: '+20 11 9876 5432',
                orderCount: 3,
                totalSpent: 8500,
                status: 'active',
                joinDate: '2024-02-20',
                lastActive: new Date().toISOString().split('T')[0]
            },
            {
                id: '3',
                name: 'Mohamed Ibrahim',
                email: 'mohamed@example.com',
                phone: '+20 12 5555 5555',
                orderCount: 1,
                totalSpent: 2500,
                status: 'inactive',
                joinDate: '2024-03-01',
                lastActive: '2024-03-15'
            }
        ];
        
        localStorage.setItem('admin_users', JSON.stringify(mockUsers));
        
        return {
            total: mockUsers.length,
            activeToday: mockUsers.filter(u => u.lastActive === new Date().toISOString().split('T')[0]).length,
            newThisMonth: mockUsers.filter(u => {
                const joinDate = new Date(u.joinDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
            }).length,
            users: mockUsers
        };
    },

    // Helper functions
    isToday(dateString) {
        const today = new Date();
        const date = new Date(dateString);
        return date.toDateString() === today.toDateString();
    },

    // Placeholder functions for admin actions
    addNewProduct() {
        alert('Add New Product feature coming soon!');
    },

    processOrders() {
        alert('Process Orders feature coming soon!');
    },

    updateInventory() {
        alert('Update Inventory feature coming soon!');
    },

    viewOrder(orderId) {
        alert(`View order ${orderId} feature coming soon!`);
    },

    updateOrderStatus(orderId) {
        alert(`Update order ${orderId} status feature coming soon!`);
    },

    confirmOrder(orderId) {
        alert(`Confirm order ${orderId} feature coming soon!`);
    },

    editProduct(productId) {
        alert(`Edit product ${productId} feature coming soon!`);
    },

    toggleProductStatus(productId) {
        alert(`Toggle product ${productId} status feature coming soon!`);
    },

    updateStock(productId) {
        alert(`Update stock for product ${productId} feature coming soon!`);
    },

    filterOrders() {
        // Implementation for filtering orders
        console.log('Filtering orders...');
    },

    filterProducts() {
        // Implementation for filtering products
        console.log('Filtering products...');
    },

    dismissAlert(alertId) {
        document.querySelector(`[onclick*="${alertId}"]`).parentElement.remove();
    },

    showCustomerManager() {
        this.setActiveNav('customers');
        document.getElementById('adminMainContent').innerHTML = '<div class="admin-section"><h2>Customer Management</h2><p>Coming soon...</p></div>';
    },

    showInventoryManager() {
        this.setActiveNav('inventory');
        document.getElementById('adminMainContent').innerHTML = '<div class="admin-section"><h2>Inventory Management</h2><p>Coming soon...</p></div>';
    },

    showAnalytics() {
        this.setActiveNav('analytics');
        document.getElementById('adminMainContent').innerHTML = '<div class="admin-section"><h2>Business Analytics</h2><p>Coming soon...</p></div>';
    },

    showSettings() {
        const content = `
            <div class="admin-settings">
                <h2>System Settings</h2>
                
                <div class="settings-section">
                    <h3>Business Information</h3>
                    <form id="businessSettingsForm">
                        <div class="form-group">
                            <label>Business Name</label>
                            <input type="text" class="form-control" value="Sheep Land Egypt" />
                        </div>
                        <div class="form-group">
                            <label>Contact Email</label>
                            <input type="email" class="form-control" value="info@sheep.land" />
                        </div>
                        <div class="form-group">
                            <label>Contact Phone</label>
                            <input type="tel" class="form-control" value="+20 123 456 7890" />
                        </div>
                        <button type="button" class="btn bp">Save Business Settings</button>
                    </form>
                </div>
                
                <div class="settings-section">
                    <h3>Payment Settings</h3>
                    <form id="paymentSettingsForm">
                        <div class="form-group">
                            <label>Accepted Payment Methods</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" checked> Cash on Delivery</label>
                                <label><input type="checkbox" checked> Bank Transfer</label>
                                <label><input type="checkbox" checked> InstaPay</label>
                                <label><input type="checkbox"> Credit Card</label>
                            </div>
                        </div>
                        <button type="button" class="btn bp">Save Payment Settings</button>
                    </form>
                </div>
                
                <div class="settings-section">
                    <h3>Delivery Settings</h3>
                    <form id="deliverySettingsForm">
                        <div class="form-group">
                            <label>Delivery Fee (EGP)</label>
                            <input type="number" class="form-control" value="50" />
                        </div>
                        <div class="form-group">
                            <label>Free Delivery Above (EGP)</label>
                            <input type="number" class="form-control" value="1000" />
                        </div>
                        <button type="button" class="btn bp">Save Delivery Settings</button>
                    </form>
                </div>
                
                <div class="settings-section">
                    <h3>System Preferences</h3>
                    <form id="systemSettingsForm">
                        <div class="form-group">
                            <label><input type="checkbox" checked> Enable Order Notifications</label>
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox" checked> Enable Low Stock Alerts</label>
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox"> Maintenance Mode</label>
                        </div>
                        <button type="button" class="btn bp">Save System Settings</button>
                    </form>
                </div>
            </div>
        `;
        
        this.showAdminModal('Settings', content);
    },

    // Show livestock management
    showLivestockManager() {
        this.setActiveNav('livestock');
        const content = document.getElementById('adminMainContent');
        const livestock = this.getLivestockData();
        
        content.innerHTML = `
            <div class="admin-livestock">
                <div class="section-header">
                    <h2>Livestock Management</h2>
                    <button onclick="adminSystem.addNewAnimal()" class="btn-primary">➕ Add New Animal</button>
                </div>
                
                <!-- Livestock Overview -->
                <div class="livestock-overview">
                    <div class="livestock-stats">
                        <div class="stat-card">
                            <h3>Total Sheep</h3>
                            <p class="stat-number">${livestock.total}</p>
                            <span class="stat-detail">Active in farm</span>
                        </div>
                        <div class="stat-card">
                            <h3>Breeding Stock</h3>
                            <p class="stat-number">${livestock.breeding}</p>
                            <span class="stat-detail">Rams & Ewes</span>
                        </div>
                        <div class="stat-card">
                            <h3>Ready for Sale</h3>
                            <p class="stat-number">${livestock.readyForSale}</p>
                            <span class="stat-detail">Market ready</span>
                        </div>
                        <div class="stat-card">
                            <h3>Health Alerts</h3>
                            <p class="stat-number text-warning">${livestock.healthAlerts}</p>
                            <span class="stat-detail">Need attention</span>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="livestock-filters">
                    <select id="livestockStatusFilter" onchange="adminSystem.filterLivestock()">
                        <option value="">All Status</option>
                        <option value="healthy">Healthy</option>
                        <option value="pregnant">Pregnant</option>
                        <option value="sick">Sick</option>
                        <option value="sold">Sold</option>
                    </select>
                    <select id="livestockTypeFilter" onchange="adminSystem.filterLivestock()">
                        <option value="">All Types</option>
                        <option value="ram">Ram</option>
                        <option value="ewe">Ewe</option>
                        <option value="lamb">Lamb</option>
                    </select>
                    <input type="text" id="livestockSearchFilter" placeholder="Search by ID or name..." onkeyup="adminSystem.filterLivestock()">
                </div>

                <!-- Livestock Table -->
                <div class="livestock-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Photo</th>
                                <th>Type</th>
                                <th>Age</th>
                                <th>Weight</th>
                                <th>Health</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${livestock.animals.map(animal => `
                                <tr class="livestock-row" data-status="${animal.status}" data-type="${animal.type}">
                                    <td class="animal-id">${animal.id}</td>
                                    <td>
                                        <img src="${animal.photo}" alt="${animal.id}" class="animal-photo">
                                    </td>
                                    <td>
                                        <div class="animal-type">
                                            <strong>${animal.type}</strong>
                                            <br><small>${animal.breed}</small>
                                        </div>
                                    </td>
                                    <td>${animal.age}</td>
                                    <td>${animal.weight}kg</td>
                                    <td>
                                        <span class="health-status status-${animal.health.status}">
                                            ${animal.health.status}
                                        </span>
                                        ${animal.health.lastCheckup ? `<br><small>Last: ${animal.health.lastCheckup}</small>` : ''}
                                    </td>
                                    <td>${animal.location}</td>
                                    <td>
                                        <span class="status-badge status-${animal.status}">${animal.status}</span>
                                    </td>
                                    <td class="animal-actions">
                                        <button onclick="adminSystem.viewAnimal('${animal.id}')" class="btn-sm">👁️ View</button>
                                        <button onclick="adminSystem.updateHealth('${animal.id}')" class="btn-sm">🏥 Health</button>
                                        <button onclick="adminSystem.recordWeight('${animal.id}')" class="btn-sm">⚖️ Weight</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Show farm operations
    showFarmOperations() {
        this.setActiveNav('farm');
        const content = document.getElementById('adminMainContent');
        const operations = this.getFarmOperationsData();
        
        content.innerHTML = `
            <div class="admin-farm">
                <div class="section-header">
                    <h2>Farm Operations</h2>
                    <button onclick="adminSystem.scheduleTask()" class="btn-primary">📅 Schedule Task</button>
                </div>
                
                <!-- Today's Tasks -->
                <div class="daily-tasks">
                    <h3>Today's Tasks</h3>
                    <div class="task-list">
                        ${operations.todayTasks.map(task => `
                            <div class="task-item ${task.completed ? 'completed' : ''}">
                                <div class="task-info">
                                    <h4>${task.title}</h4>
                                    <p>${task.description}</p>
                                    <span class="task-time">${task.time}</span>
                                </div>
                                <div class="task-actions">
                                    <button onclick="adminSystem.toggleTask('${task.id}')" class="btn-sm ${task.completed ? 'completed' : 'success'}">
                                        ${task.completed ? '✅ Done' : '☐ Mark Done'}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Farm Sections -->
                <div class="farm-sections">
                    <div class="farm-section">
                        <h3>🍃 Feeding Management</h3>
                        <div class="feeding-stats">
                            <div class="feed-metric">
                                <span class="metric-label">Today's Feed</span>
                                <span class="metric-value">${operations.feeding.todayAmount}kg</span>
                            </div>
                            <div class="feed-metric">
                                <span class="metric-label">Feed Stock</span>
                                <span class="metric-value">${operations.feeding.stockDays} days</span>
                            </div>
                        </div>
                        <button onclick="adminSystem.recordFeeding()" class="action-btn">📝 Record Feeding</button>
                    </div>

                    <div class="farm-section">
                        <h3>🏥 Veterinary Care</h3>
                        <div class="vet-stats">
                            <div class="vet-metric">
                                <span class="metric-label">Scheduled Visits</span>
                                <span class="metric-value">${operations.veterinary.scheduledVisits}</span>
                            </div>
                            <div class="vet-metric">
                                <span class="metric-label">Vaccinations Due</span>
                                <span class="metric-value text-warning">${operations.veterinary.vaccinationsDue}</span>
                            </div>
                        </div>
                        <button onclick="adminSystem.scheduleVet()" class="action-btn">🏥 Schedule Vet</button>
                    </div>

                    <div class="farm-section">
                        <h3>👶 Breeding Program</h3>
                        <div class="breeding-stats">
                            <div class="breeding-metric">
                                <span class="metric-label">Pregnant Ewes</span>
                                <span class="metric-value">${operations.breeding.pregnantEwes}</span>
                            </div>
                            <div class="breeding-metric">
                                <span class="metric-label">Expected Births</span>
                                <span class="metric-value">${operations.breeding.expectedBirths}</span>
                            </div>
                        </div>
                        <button onclick="adminSystem.recordBreeding()" class="action-btn">👶 Record Breeding</button>
                    </div>
                </div>

                <!-- Upcoming Events -->
                <div class="upcoming-events">
                    <h3>📅 Upcoming Events</h3>
                    <div class="events-list">
                        ${operations.upcomingEvents.map(event => `
                            <div class="event-item">
                                <div class="event-date">
                                    <span class="event-day">${event.day}</span>
                                    <span class="event-month">${event.month}</span>
                                </div>
                                <div class="event-details">
                                    <h4>${event.title}</h4>
                                    <p>${event.description}</p>
                                    <span class="event-type">${event.type}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // Show financial management
    showFinancialManager() {
        this.setActiveNav('financial');
        const content = document.getElementById('adminMainContent');
        const financial = this.getFinancialData();
        
        content.innerHTML = `
            <div class="admin-financial">
                <div class="section-header">
                    <h2>Financial Management</h2>
                    <div class="financial-actions">
                        <button onclick="adminSystem.addExpense()" class="btn-secondary">➕ Add Expense</button>
                        <button onclick="adminSystem.generateReport()" class="btn-primary">📊 Generate Report</button>
                    </div>
                </div>
                
                <!-- Financial Overview -->
                <div class="financial-overview">
                    <div class="financial-cards">
                        <div class="financial-card revenue">
                            <div class="card-header">
                                <h3>Monthly Revenue</h3>
                                <span class="card-icon">💰</span>
                            </div>
                            <p class="card-amount">$${financial.monthlyRevenue.toLocaleString()}</p>
                            <span class="card-change positive">+${financial.revenueGrowth}% vs last month</span>
                        </div>
                        
                        <div class="financial-card expenses">
                            <div class="card-header">
                                <h3>Monthly Expenses</h3>
                                <span class="card-icon">💸</span>
                            </div>
                            <p class="card-amount">$${financial.monthlyExpenses.toLocaleString()}</p>
                            <span class="card-change negative">+${financial.expenseGrowth}% vs last month</span>
                        </div>
                        
                        <div class="financial-card profit">
                            <div class="card-header">
                                <h3>Net Profit</h3>
                                <span class="card-icon">📈</span>
                            </div>
                            <p class="card-amount">$${financial.netProfit.toLocaleString()}</p>
                            <span class="card-change ${financial.profitMargin > 0 ? 'positive' : 'negative'}">
                                ${financial.profitMargin}% margin
                            </span>
                        </div>
                        
                        <div class="financial-card cashflow">
                            <div class="card-header">
                                <h3>Cash Flow</h3>
                                <span class="card-icon">💳</span>
                            </div>
                            <p class="card-amount">$${financial.cashFlow.toLocaleString()}</p>
                            <span class="card-change ${financial.cashFlow > 0 ? 'positive' : 'negative'}">
                                ${financial.cashFlow > 0 ? 'Positive' : 'Negative'} flow
                            </span>
                        </div>
                    </div>
                </div>

                <!-- P&L Statement -->
                <div class="profit-loss">
                    <h3>Profit & Loss Statement (This Month)</h3>
                    <div class="pl-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>% of Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="revenue-row">
                                    <td><strong>Total Revenue</strong></td>
                                    <td class="amount positive"><strong>$${financial.monthlyRevenue.toLocaleString()}</strong></td>
                                    <td>100%</td>
                                </tr>
                                ${financial.expenseBreakdown.map(expense => `
                                    <tr>
                                        <td>${expense.category}</td>
                                        <td class="amount negative">-$${expense.amount.toLocaleString()}</td>
                                        <td>${((expense.amount / financial.monthlyRevenue) * 100).toFixed(1)}%</td>
                                    </tr>
                                `).join('')}
                                <tr class="total-row">
                                    <td><strong>Net Profit</strong></td>
                                    <td class="amount ${financial.netProfit > 0 ? 'positive' : 'negative'}">
                                        <strong>$${financial.netProfit.toLocaleString()}</strong>
                                    </td>
                                    <td><strong>${financial.profitMargin}%</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="recent-transactions">
                    <h3>Recent Transactions</h3>
                    <div class="transactions-list">
                        ${financial.recentTransactions.map(transaction => `
                            <div class="transaction-item">
                                <div class="transaction-info">
                                    <h4>${transaction.description}</h4>
                                    <span class="transaction-date">${transaction.date}</span>
                                </div>
                                <div class="transaction-amount ${transaction.type}">
                                    ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toLocaleString()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // Show business reports
    showBusinessReports() {
        this.setActiveNav('reports');
        const content = document.getElementById('adminMainContent');
        
        content.innerHTML = `
            <div class="admin-reports">
                <div class="section-header">
                    <h2>Business Reports & Analytics</h2>
                    <button onclick="adminSystem.exportReport()" class="btn-primary">📄 Export Report</button>
                </div>
                
                <!-- Report Categories -->
                <div class="report-categories">
                    <div class="report-card" onclick="adminSystem.generateSalesReport()">
                        <div class="report-icon">📊</div>
                        <h3>Sales Report</h3>
                        <p>Revenue trends, top products, customer analysis</p>
                    </div>
                    
                    <div class="report-card" onclick="adminSystem.generateLivestockReport()">
                        <div class="report-icon">🐑</div>
                        <h3>Livestock Report</h3>
                        <p>Herd status, health records, breeding data</p>
                    </div>
                    
                    <div class="report-card" onclick="adminSystem.generateFinancialReport()">
                        <div class="report-icon">💰</div>
                        <h3>Financial Report</h3>
                        <p>P&L, cash flow, expense analysis</p>
                    </div>
                    
                    <div class="report-card" onclick="adminSystem.generateOperationsReport()">
                        <div class="report-icon">🚜</div>
                        <h3>Operations Report</h3>
                        <p>Farm activities, task completion, efficiency</p>
                    </div>
                    
                    <div class="report-card" onclick="adminSystem.generateForecastReport()">
                        <div class="report-icon">🔮</div>
                        <h3>Business Forecast</h3>
                        <p>Predictive analytics, growth projections, planning</p>
                    </div>
                    
                    <div class="report-card" onclick="adminSystem.generateSupplierReport()">
                        <div class="report-icon">🏪</div>
                        <h3>Supplier Analysis</h3>
                        <p>Supplier performance, costs, recommendations</p>
                    </div>
                </div>

                <!-- Quick Insights -->
                <div class="business-insights">
                    <h3>Business Insights</h3>
                    <div class="insights-grid">
                        <div class="insight-item">
                            <h4>Best Selling Product</h4>
                            <p>Premium Udheya Sheep</p>
                            <span class="insight-value">45% of sales</span>
                        </div>
                        <div class="insight-item">
                            <h4>Peak Sales Period</h4>
                            <p>Eid Al-Adha Season</p>
                            <span class="insight-value">300% increase</span>
                        </div>
                        <div class="insight-item">
                            <h4>Customer Retention</h4>
                            <p>Repeat Customers</p>
                            <span class="insight-value">65% return rate</span>
                        </div>
                        <div class="insight-item">
                            <h4>Profit Margin Trend</h4>
                            <p>Last 3 Months</p>
                            <span class="insight-value">+8% improvement</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Show supplier management
    showSupplierManager() {
        this.setActiveNav('suppliers');
        const content = document.getElementById('adminMainContent');
        const suppliers = this.getSupplierData();
        
        content.innerHTML = `
            <div class="admin-suppliers">
                <div class="section-header">
                    <h2>Supplier Management</h2>
                    <button onclick="adminSystem.addNewSupplier()" class="btn-primary">➕ Add New Supplier</button>
                </div>
                
                <!-- Supplier Overview -->
                <div class="supplier-overview">
                    <div class="supplier-stats">
                        <div class="stat-card">
                            <h3>Total Suppliers</h3>
                            <p class="stat-number">${suppliers.total}</p>
                            <span class="stat-detail">Active partnerships</span>
                        </div>
                        <div class="stat-card">
                            <h3>Monthly Spend</h3>
                            <p class="stat-number">$${suppliers.monthlySpend.toLocaleString()}</p>
                            <span class="stat-detail">This month</span>
                        </div>
                        <div class="stat-card">
                            <h3>Feed Suppliers</h3>
                            <p class="stat-number">${suppliers.feedSuppliers}</p>
                            <span class="stat-detail">Active feed sources</span>
                        </div>
                        <div class="stat-card">
                            <h3>Vet Services</h3>
                            <p class="stat-number">${suppliers.vetServices}</p>
                            <span class="stat-detail">Veterinary providers</span>
                        </div>
                    </div>
                </div>

                <!-- Supplier Filters -->
                <div class="supplier-filters">
                    <select id="supplierCategoryFilter" onchange="adminSystem.filterSuppliers()">
                        <option value="">All Categories</option>
                        <option value="feed">Feed & Nutrition</option>
                        <option value="veterinary">Veterinary Services</option>
                        <option value="equipment">Equipment</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="transportation">Transportation</option>
                        <option value="other">Other</option>
                    </select>
                    <select id="supplierStatusFilter" onchange="adminSystem.filterSuppliers()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                    <input type="text" id="supplierSearchFilter" placeholder="Search suppliers..." onkeyup="adminSystem.filterSuppliers()">
                </div>

                <!-- Suppliers List -->
                <div class="suppliers-grid">
                    ${suppliers.list.map(supplier => `
                        <div class="supplier-card" data-category="${supplier.category}" data-status="${supplier.status}">
                            <div class="supplier-header">
                                <div class="supplier-info">
                                    <h4 class="supplier-name">${supplier.name}</h4>
                                    <p class="supplier-category">${supplier.category}</p>
                                    <span class="status-badge status-${supplier.status}">${supplier.status}</span>
                                </div>
                                <div class="supplier-actions">
                                    <button onclick="adminSystem.viewSupplier('${supplier.id}')" class="btn-sm">👁️ View</button>
                                    <button onclick="adminSystem.editSupplier('${supplier.id}')" class="btn-sm">✏️ Edit</button>
                                </div>
                            </div>
                            <div class="supplier-details">
                                <div class="detail-item">
                                    <span class="detail-label">Contact:</span>
                                    <span class="detail-value">${supplier.contact}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${supplier.phone}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Monthly Spend:</span>
                                    <span class="detail-value">$${supplier.monthlySpend}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Rating:</span>
                                    <span class="detail-value">${'⭐'.repeat(supplier.rating)}</span>
                                </div>
                            </div>
                            <div class="supplier-quick-actions">
                                <button onclick="adminSystem.createPurchaseOrder('${supplier.id}')" class="btn secondary sm">📦 New Order</button>
                                <button onclick="adminSystem.viewSupplierHistory('${supplier.id}')" class="btn ghost sm">📈 History</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Quick Add Expense -->
                <div class="quick-expense">
                    <h3>Quick Add Expense</h3>
                    <form id="quickExpenseForm" onsubmit="adminSystem.saveQuickExpense(event)">
                        <div class="quick-form-grid">
                            <select id="quickSupplier" class="form-input" required>
                                <option value="">Select supplier</option>
                                ${suppliers.list.filter(s => s.status === 'active').map(s => `
                                    <option value="${s.id}">${s.name}</option>
                                `).join('')}
                            </select>
                            <input type="number" id="quickAmount" class="form-input" placeholder="Amount ($)" step="0.01" required>
                            <input type="text" id="quickDescription" class="form-input" placeholder="Description" required>
                            <button type="submit" class="btn prim">💾 Add Expense</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    // Show farm calendar
    showFarmCalendar() {
        this.setActiveNav('calendar');
        const content = document.getElementById('adminMainContent');
        const calendarData = this.getCalendarData();
        
        content.innerHTML = `
            <div class="admin-calendar">
                <div class="section-header">
                    <h2>Farm Calendar & Task Scheduling</h2>
                    <div class="calendar-actions">
                        <button onclick="adminSystem.scheduleTask()" class="btn-primary">➕ Schedule Task</button>
                        <button onclick="adminSystem.addEvent()" class="btn-secondary">📅 Add Event</button>
                    </div>
                </div>
                
                <!-- Calendar Navigation -->
                <div class="calendar-nav">
                    <button onclick="adminSystem.previousMonth()" class="btn ghost">‹ Previous</button>
                    <h3 id="currentMonth">${calendarData.currentMonth}</h3>
                    <button onclick="adminSystem.nextMonth()" class="btn ghost">Next ›</button>
                    <div class="view-toggles">
                        <button onclick="adminSystem.setCalendarView('month')" class="view-btn active" data-view="month">Month</button>
                        <button onclick="adminSystem.setCalendarView('week')" class="view-btn" data-view="week">Week</button>
                        <button onclick="adminSystem.setCalendarView('agenda')" class="view-btn" data-view="agenda">Agenda</button>
                    </div>
                </div>

                <!-- Calendar Grid -->
                <div class="calendar-container">
                    <div class="calendar-view" id="monthView">
                        <div class="calendar-header">
                            <div class="day-header">Sun</div>
                            <div class="day-header">Mon</div>
                            <div class="day-header">Tue</div>
                            <div class="day-header">Wed</div>
                            <div class="day-header">Thu</div>
                            <div class="day-header">Fri</div>
                            <div class="day-header">Sat</div>
                        </div>
                        <div class="calendar-grid" id="calendarGrid">
                            ${this.generateCalendarGrid(calendarData)}
                        </div>
                    </div>
                </div>

                <!-- Task Summary -->
                <div class="task-summary">
                    <div class="summary-section">
                        <h3>Today's Tasks</h3>
                        <div class="today-tasks">
                            ${calendarData.todayTasks.map(task => `
                                <div class="task-item ${task.completed ? 'completed' : ''}" data-priority="${task.priority}">
                                    <div class="task-checkbox">
                                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                               onchange="adminSystem.toggleTaskComplete('${task.id}')">
                                    </div>
                                    <div class="task-info">
                                        <h4>${task.title}</h4>
                                        <p>${task.description}</p>
                                        <span class="task-time">${task.time}</span>
                                        <span class="task-type ${task.type}">${task.type}</span>
                                    </div>
                                    <div class="task-actions">
                                        <button onclick="adminSystem.editTask('${task.id}')" class="btn-sm">✏️</button>
                                        <button onclick="adminSystem.deleteTask('${task.id}')" class="btn-sm">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="summary-section">
                        <h3>Upcoming Events</h3>
                        <div class="upcoming-events">
                            ${calendarData.upcomingEvents.map(event => `
                                <div class="event-item">
                                    <div class="event-date">
                                        <span class="event-day">${event.day}</span>
                                        <span class="event-month">${event.month}</span>
                                    </div>
                                    <div class="event-details">
                                        <h4>${event.title}</h4>
                                        <p>${event.description}</p>
                                        <span class="event-type ${event.type}">${event.type}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Task Analytics -->
                <div class="task-analytics">
                    <h3>Task Analytics</h3>
                    <div class="analytics-grid">
                        <div class="analytic-card">
                            <h4>Completion Rate</h4>
                            <p class="analytic-value">${calendarData.analytics.completionRate}%</p>
                            <span class="analytic-detail">This week</span>
                        </div>
                        <div class="analytic-card">
                            <h4>Overdue Tasks</h4>
                            <p class="analytic-value text-warning">${calendarData.analytics.overdueTasks}</p>
                            <span class="analytic-detail">Need attention</span>
                        </div>
                        <div class="analytic-card">
                            <h4>Avg Daily Tasks</h4>
                            <p class="analytic-value">${calendarData.analytics.avgDailyTasks}</p>
                            <span class="analytic-detail">Per day</span>
                        </div>
                        <div class="analytic-card">
                            <h4>Most Active Day</h4>
                            <p class="analytic-value">${calendarData.analytics.mostActiveDay}</p>
                            <span class="analytic-detail">This week</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get livestock data (with stored animals)
    getLivestockData() {
        const stored = JSON.parse(localStorage.getItem('admin_livestock') || '[]');
        
        // Default animals if none stored
        const defaultAnimals = [
            {
                id: 'SH-001',
                type: 'Ram',
                breed: 'Awassi',
                age: '2 years',
                weight: 85,
                health: { status: 'healthy', lastCheckup: '2024-01-15' },
                location: 'Pen A1',
                status: 'breeding',
                photo: 'images/products/sheep-field.jpg'
            },
            {
                id: 'SH-002',
                type: 'Ewe',
                breed: 'Barki',
                age: '3 years',
                weight: 65,
                health: { status: 'pregnant', lastCheckup: '2024-01-10' },
                location: 'Pen B2',
                status: 'breeding',
                photo: 'images/products/sheep-field.jpg'
            },
            {
                id: 'SH-003',
                type: 'Lamb',
                breed: 'Ossimi',
                age: '8 months',
                weight: 45,
                health: { status: 'healthy', lastCheckup: '2024-01-12' },
                location: 'Pen C1',
                status: 'growing',
                photo: 'images/products/sheep-field.jpg'
            }
        ];

        const allAnimals = stored.length > 0 ? [...defaultAnimals, ...stored] : defaultAnimals;
        
        return {
            total: allAnimals.length,
            breeding: allAnimals.filter(a => a.status === 'breeding').length,
            readyForSale: allAnimals.filter(a => a.status === 'healthy' && a.type !== 'Lamb').length,
            healthAlerts: allAnimals.filter(a => a.health.status === 'sick').length,
            animals: allAnimals
        };
    },

    getFarmOperationsData() {
        const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
        const feedingRecords = JSON.parse(localStorage.getItem('feeding_records') || '[]');
        const vetVisits = JSON.parse(localStorage.getItem('vet_visits') || '[]');
        const breedingRecords = JSON.parse(localStorage.getItem('breeding_records') || '[]');
        
        const today = new Date().toISOString().split('T')[0];
        const todayFeeding = feedingRecords.filter(f => f.date === today);
        const todayFeedAmount = todayFeeding.reduce((sum, f) => sum + f.amount, 0);
        
        // Default tasks if none stored
        const defaultTasks = [
            { id: 't1', title: 'Morning Feeding', description: 'Feed all sheep in Pen A & B', time: '07:00', completed: true },
            { id: 't2', title: 'Health Check', description: 'Check pregnant ewes', time: '09:00', completed: false },
            { id: 't3', title: 'Water System', description: 'Refill water troughs', time: '14:00', completed: false }
        ];
        
        const todayTasks = tasks.filter(t => t.date === today).length > 0 
            ? tasks.filter(t => t.date === today) 
            : defaultTasks;
            
        const scheduledVetVisits = vetVisits.filter(v => v.status === 'scheduled').length;
        const pregnantEwes = breedingRecords.filter(b => b.status === 'confirmed' && b.expectedDueDate > today).length;

        return {
            todayTasks: todayTasks,
            feeding: {
                todayAmount: Math.round(todayFeedAmount) || 120,
                stockDays: 15
            },
            veterinary: {
                scheduledVisits: scheduledVetVisits || 2,
                vaccinationsDue: 5
            },
            breeding: {
                pregnantEwes: pregnantEwes || 12,
                expectedBirths: Math.ceil(pregnantEwes * 0.8) || 8
            },
            upcomingEvents: [
                { day: '25', month: 'Jan', title: 'Vet Visit', description: 'Dr. Ahmed - Health checkup', type: 'veterinary' },
                { day: '28', month: 'Jan', title: 'Feed Delivery', description: '500kg feed delivery', type: 'supply' }
            ]
        };
    },

    getFinancialData() {
        const expenses = JSON.parse(localStorage.getItem('farm_expenses') || '[]');
        const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        
        // Filter current month data
        const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
        const monthlyOrders = orders.filter(o => o.date && o.date.startsWith(currentMonth));
        
        const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Use default data if no stored data
        const revenue = totalRevenue || 45000;
        const expenseAmount = totalExpenses || 32000;
        const profit = revenue - expenseAmount;
        
        // Group expenses by category
        const expensesByCategory = {};
        monthlyExpenses.forEach(e => {
            const categoryName = this.getCategoryDisplayName(e.category);
            expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + e.amount;
        });
        
        // Default breakdown if no expenses stored
        const defaultBreakdown = [
            { category: 'Feed & Nutrition', amount: 15000 },
            { category: 'Veterinary Care', amount: 3500 },
            { category: 'Labor', amount: 8000 },
            { category: 'Utilities', amount: 2500 },
            { category: 'Equipment', amount: 2000 },
            { category: 'Other', amount: 1000 }
        ];
        
        const expenseBreakdown = Object.keys(expensesByCategory).length > 0 
            ? Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount }))
            : defaultBreakdown;
        
        // Recent transactions
        const allTransactions = [
            ...monthlyOrders.map(o => ({
                description: `Order ${o.id} - ${o.customer?.name || 'Customer'}`,
                amount: o.total || 0,
                type: 'income',
                date: o.date
            })),
            ...monthlyExpenses.map(e => ({
                description: e.description,
                amount: e.amount,
                type: 'expense',
                date: e.date
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
        
        // Use default transactions if none available
        const recentTransactions = allTransactions.length > 0 ? allTransactions : [
            { description: 'Sheep Sale - Premium Udheya', amount: 2500, type: 'income', date: '2024-01-20' },
            { description: 'Feed Purchase', amount: 800, type: 'expense', date: '2024-01-19' },
            { description: 'Vet Services', amount: 350, type: 'expense', date: '2024-01-18' },
            { description: 'Meat Package Sale', amount: 450, type: 'income', date: '2024-01-17' }
        ];
        
        return {
            monthlyRevenue: revenue,
            monthlyExpenses: expenseAmount,
            netProfit: profit,
            profitMargin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
            cashFlow: Math.round(profit * 0.8), // Estimate cash flow
            revenueGrowth: 12, // Default growth rate
            expenseGrowth: 8,  // Default growth rate
            expenseBreakdown: expenseBreakdown,
            recentTransactions: recentTransactions
        };
    },

    getCategoryDisplayName(category) {
        const categoryNames = {
            'feed': 'Feed & Nutrition',
            'veterinary': 'Veterinary Care',
            'labor': 'Labor',
            'utilities': 'Utilities',
            'equipment': 'Equipment',
            'maintenance': 'Maintenance',
            'insurance': 'Insurance',
            'transportation': 'Transportation',
            'other': 'Other'
        };
        return categoryNames[category] || category;
    },

    // Get supplier data
    getSupplierData() {
        const stored = JSON.parse(localStorage.getItem('farm_suppliers') || '[]');
        
        // Default suppliers if none stored
        const defaultSuppliers = [
            {
                id: 'sup_001',
                name: 'Premium Feed Co.',
                category: 'feed',
                contact: 'Ahmed Mahmoud',
                phone: '+20123456789',
                email: 'sales@premiumfeed.com',
                address: 'Cairo, Egypt',
                status: 'active',
                rating: 5,
                monthlySpend: 12000,
                paymentTerms: '30 days',
                products: ['Hay', 'Grain', 'Supplements']
            },
            {
                id: 'sup_002',
                name: 'Cairo Veterinary Services',
                category: 'veterinary',
                contact: 'Dr. Sarah Hassan',
                phone: '+20123456788',
                email: 'info@cairovet.com',
                address: 'Giza, Egypt',
                status: 'active',
                rating: 4,
                monthlySpend: 3500,
                paymentTerms: 'Immediate',
                products: ['Vaccinations', 'Medical Care', 'Surgery']
            },
            {
                id: 'sup_003',
                name: 'Farm Equipment Egypt',
                category: 'equipment',
                contact: 'Mohamed Ali',
                phone: '+20123456787',
                email: 'orders@farmequipment.eg',
                address: 'Alexandria, Egypt',
                status: 'active',
                rating: 4,
                monthlySpend: 2000,
                paymentTerms: '15 days',
                products: ['Tools', 'Machinery', 'Infrastructure']
            },
            {
                id: 'sup_004',
                name: 'Transport Solutions',
                category: 'transportation',
                contact: 'Khaled Omar',
                phone: '+20123456786',
                email: 'logistics@transportsolutions.com',
                address: 'Cairo, Egypt',
                status: 'active',
                rating: 3,
                monthlySpend: 1500,
                paymentTerms: '7 days',
                products: ['Livestock Transport', 'Feed Delivery', 'Equipment Transport']
            }
        ];

        const allSuppliers = stored.length > 0 ? [...defaultSuppliers, ...stored] : defaultSuppliers;
        const totalSpend = allSuppliers.reduce((sum, s) => sum + s.monthlySpend, 0);
        
        return {
            total: allSuppliers.length,
            monthlySpend: totalSpend,
            feedSuppliers: allSuppliers.filter(s => s.category === 'feed').length,
            vetServices: allSuppliers.filter(s => s.category === 'veterinary').length,
            list: allSuppliers
        };
    },

    // Get calendar data
    getCalendarData() {
        const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
        const events = JSON.parse(localStorage.getItem('farm_events') || '[]');
        
        const today = new Date();
        const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const todayStr = today.toISOString().split('T')[0];
        
        // Get today's tasks
        const todayTasks = tasks.filter(t => t.date === todayStr);
        
        // Default tasks if none
        const defaultTasks = [
            {
                id: 'task_001',
                title: 'Morning Feeding',
                description: 'Feed all sheep in main pens',
                time: '07:00',
                type: 'feeding',
                priority: 'high',
                completed: false,
                date: todayStr
            },
            {
                id: 'task_002',
                title: 'Health Check - Pregnant Ewes',
                description: 'Check pregnant ewes for signs of labor',
                time: '10:00',
                type: 'veterinary',
                priority: 'high',
                completed: false,
                date: todayStr
            },
            {
                id: 'task_003',
                title: 'Water System Maintenance',
                description: 'Check and refill water troughs',
                time: '14:00',
                type: 'maintenance',
                priority: 'medium',
                completed: true,
                date: todayStr
            }
        ];

        const displayTasks = todayTasks.length > 0 ? todayTasks : defaultTasks;
        
        // Calculate analytics
        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.date);
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return taskDate >= weekAgo && taskDate <= today;
        });
        
        const completedTasks = weekTasks.filter(t => t.completed).length;
        const completionRate = weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 85;
        const overdueTasks = tasks.filter(t => t.date < todayStr && !t.completed).length;
        
        return {
            currentMonth: currentMonth,
            currentDate: today,
            todayTasks: displayTasks,
            upcomingEvents: [
                { day: '25', month: 'Jan', title: 'Veterinary Visit', description: 'Dr. Ahmed - Monthly checkup', type: 'veterinary' },
                { day: '27', month: 'Jan', title: 'Feed Delivery', description: '500kg premium feed delivery', type: 'supply' },
                { day: '30', month: 'Jan', title: 'Breeding Program', description: 'AI session for selected ewes', type: 'breeding' }
            ],
            analytics: {
                completionRate: completionRate,
                overdueTasks: overdueTasks,
                avgDailyTasks: Math.round(weekTasks.length / 7),
                mostActiveDay: 'Monday'
            }
        };
    },

    // Generate calendar grid
    generateCalendarGrid(calendarData) {
        const today = calendarData.currentDate;
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '';
        let currentDate = new Date(startDate);
        
        for (let week = 0; week < 6; week++) {
            html += '<div class="calendar-week">';
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === today.getMonth();
                const isToday = currentDate.toDateString() === today.toDateString();
                const dateStr = currentDate.toISOString().split('T')[0];
                
                // Get tasks for this date
                const dayTasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]')
                    .filter(t => t.date === dateStr);
                
                html += `
                    <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}" 
                         onclick="adminSystem.selectCalendarDate('${dateStr}')">
                        <span class="day-number">${currentDate.getDate()}</span>
                        ${dayTasks.length > 0 ? `
                            <div class="day-tasks">
                                ${dayTasks.slice(0, 2).map(task => `
                                    <div class="task-dot ${task.type} ${task.completed ? 'completed' : ''}"></div>
                                `).join('')}
                                ${dayTasks.length > 2 ? `<div class="task-count">+${dayTasks.length - 2}</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
                currentDate.setDate(currentDate.getDate() + 1);
            }
            html += '</div>';
        }
        
        return html;
    },

    // Supplier management functions
    addNewSupplier() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Add New Supplier</h2>
                <form onsubmit="adminSystem.saveNewSupplier(event)">
                    <div class="form-group">
                        <label>Supplier Name</label>
                        <input type="text" id="supplierName" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="supplierCategory" class="feedback-input" required>
                            <option value="">Select category</option>
                            <option value="feed">Feed & Nutrition</option>
                            <option value="veterinary">Veterinary Services</option>
                            <option value="equipment">Equipment</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="transportation">Transportation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Contact Person</label>
                        <input type="text" id="supplierContact" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" id="supplierPhone" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="supplierEmail" class="feedback-input">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="supplierAddress" class="feedback-textarea" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Payment Terms</label>
                        <select id="supplierTerms" class="feedback-input">
                            <option value="immediate">Immediate</option>
                            <option value="7 days">7 days</option>
                            <option value="15 days">15 days</option>
                            <option value="30 days">30 days</option>
                            <option value="60 days">60 days</option>
                        </select>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Add Supplier</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveNewSupplier(event) {
        event.preventDefault();
        
        const supplier = {
            id: 'sup_' + Date.now(),
            name: document.getElementById('supplierName').value,
            category: document.getElementById('supplierCategory').value,
            contact: document.getElementById('supplierContact').value,
            phone: document.getElementById('supplierPhone').value,
            email: document.getElementById('supplierEmail').value,
            address: document.getElementById('supplierAddress').value,
            paymentTerms: document.getElementById('supplierTerms').value,
            status: 'active',
            rating: 3,
            monthlySpend: 0,
            products: [],
            createdAt: new Date().toISOString()
        };

        const suppliers = JSON.parse(localStorage.getItem('farm_suppliers') || '[]');
        suppliers.push(supplier);
        localStorage.setItem('farm_suppliers', JSON.stringify(suppliers));

        document.querySelector('.feedback-modal-overlay').remove();
        this.showSupplierManager();
        this.showNotification('Supplier added successfully!', 'success');
    },

    viewSupplier(id) {
        const suppliers = this.getSupplierData().list;
        const supplier = suppliers.find(s => s.id === id);
        
        if (!supplier) return;

        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal supplier-details">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Supplier Details - ${supplier.name}</h2>
                
                <div class="supplier-profile">
                    <div class="profile-section">
                        <h3>Contact Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Contact Person:</label>
                                <span>${supplier.contact}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone:</label>
                                <span>${supplier.phone}</span>
                            </div>
                            <div class="info-item">
                                <label>Email:</label>
                                <span>${supplier.email || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Address:</label>
                                <span>${supplier.address}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Business Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Category:</label>
                                <span>${supplier.category}</span>
                            </div>
                            <div class="info-item">
                                <label>Rating:</label>
                                <span>${'⭐'.repeat(supplier.rating)}</span>
                            </div>
                            <div class="info-item">
                                <label>Monthly Spend:</label>
                                <span>$${supplier.monthlySpend.toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <label>Payment Terms:</label>
                                <span>${supplier.paymentTerms}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="supplier-actions">
                    <button onclick="adminSystem.editSupplier('${supplier.id}')" class="btn secondary">✏️ Edit Supplier</button>
                    <button onclick="adminSystem.createPurchaseOrder('${supplier.id}')" class="btn prim">📦 Create Order</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    createPurchaseOrder(supplierId) {
        alert(`Create purchase order for supplier ${supplierId} - feature coming soon!`);
    },

    viewSupplierHistory(supplierId) {
        alert(`View supplier ${supplierId} history - feature coming soon!`);
    },

    editSupplier(supplierId) {
        alert(`Edit supplier ${supplierId} - feature coming soon!`);
    },

    filterSuppliers() {
        const category = document.getElementById('supplierCategoryFilter').value;
        const status = document.getElementById('supplierStatusFilter').value;
        const search = document.getElementById('supplierSearchFilter').value.toLowerCase();
        
        const cards = document.querySelectorAll('.supplier-card');
        cards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardStatus = card.dataset.status;
            const cardText = card.textContent.toLowerCase();
            
            const matchesCategory = !category || cardCategory === category;
            const matchesStatus = !status || cardStatus === status;
            const matchesSearch = !search || cardText.includes(search);
            
            card.style.display = matchesCategory && matchesStatus && matchesSearch ? 'block' : 'none';
        });
    },

    saveQuickExpense(event) {
        event.preventDefault();
        
        const supplierId = document.getElementById('quickSupplier').value;
        const amount = parseFloat(document.getElementById('quickAmount').value);
        const description = document.getElementById('quickDescription').value;
        
        const suppliers = this.getSupplierData().list;
        const supplier = suppliers.find(s => s.id === supplierId);
        
        const expense = {
            id: 'exp_' + Date.now(),
            category: supplier?.category || 'other',
            amount: amount,
            description: description,
            supplier: supplier?.name || 'Unknown',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'pending',
            createdAt: new Date().toISOString()
        };

        const expenses = JSON.parse(localStorage.getItem('farm_expenses') || '[]');
        expenses.push(expense);
        localStorage.setItem('farm_expenses', JSON.stringify(expenses));

        // Reset form
        document.getElementById('quickExpenseForm').reset();
        this.showNotification('Expense added successfully!', 'success');
    },

    // Calendar management functions
    addEvent() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Add Farm Event</h2>
                <form onsubmit="adminSystem.saveNewEvent(event)">
                    <div class="form-group">
                        <label>Event Title</label>
                        <input type="text" id="eventTitle" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="eventDescription" class="feedback-textarea" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Event Type</label>
                        <select id="eventType" class="feedback-input" required>
                            <option value="">Select type</option>
                            <option value="veterinary">Veterinary</option>
                            <option value="breeding">Breeding</option>
                            <option value="supply">Supply Delivery</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inspection">Inspection</option>
                            <option value="market">Market/Sale</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="eventDate" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" id="eventTime" class="feedback-input">
                    </div>
                    <div class="form-group">
                        <label>Duration (hours)</label>
                        <input type="number" id="eventDuration" class="feedback-input" step="0.5" value="1">
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Add Event</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveNewEvent(event) {
        event.preventDefault();
        
        const newEvent = {
            id: 'event_' + Date.now(),
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            type: document.getElementById('eventType').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            duration: parseFloat(document.getElementById('eventDuration').value),
            createdAt: new Date().toISOString()
        };

        const events = JSON.parse(localStorage.getItem('farm_events') || '[]');
        events.push(newEvent);
        localStorage.setItem('farm_events', JSON.stringify(events));

        document.querySelector('.feedback-modal-overlay').remove();
        this.showFarmCalendar();
        this.showNotification('Event added successfully!', 'success');
    },

    toggleTaskComplete(taskId) {
        const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            localStorage.setItem('farm_tasks', JSON.stringify(tasks));
            this.showFarmCalendar(); // Refresh view
        }
    },

    editTask(taskId) {
        alert(`Edit task ${taskId} - feature coming soon!`);
    },

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
            const filteredTasks = tasks.filter(t => t.id !== taskId);
            localStorage.setItem('farm_tasks', JSON.stringify(filteredTasks));
            this.showFarmCalendar();
            this.showNotification('Task deleted', 'info');
        }
    },

    selectCalendarDate(date) {
        alert(`Calendar date ${date} selected - feature coming soon!`);
    },

    previousMonth() {
        alert('Previous month navigation - feature coming soon!');
    },

    nextMonth() {
        alert('Next month navigation - feature coming soon!');
    },

    setCalendarView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        // Calendar view switching would be implemented here
    },

    // Livestock management functions
    addNewAnimal() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Add New Animal</h2>
                <form id="addAnimalForm" onsubmit="adminSystem.saveNewAnimal(event)">
                    <div class="form-group">
                        <label>Animal ID</label>
                        <input type="text" id="animalId" class="feedback-input" placeholder="SH-001" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="animalType" class="feedback-input" required>
                            <option value="">Select type</option>
                            <option value="ram">Ram</option>
                            <option value="ewe">Ewe</option>
                            <option value="lamb">Lamb</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Breed</label>
                        <select id="animalBreed" class="feedback-input" required>
                            <option value="">Select breed</option>
                            <option value="Awassi">Awassi</option>
                            <option value="Barki">Barki</option>
                            <option value="Ossimi">Ossimi</option>
                            <option value="Rahmani">Rahmani</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Age</label>
                        <input type="text" id="animalAge" class="feedback-input" placeholder="2 years" required>
                    </div>
                    <div class="form-group">
                        <label>Weight (kg)</label>
                        <input type="number" id="animalWeight" class="feedback-input" placeholder="65" required>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="animalLocation" class="feedback-input" placeholder="Pen A1" required>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="animalStatus" class="feedback-input" required>
                            <option value="">Select status</option>
                            <option value="healthy">Healthy</option>
                            <option value="pregnant">Pregnant</option>
                            <option value="breeding">Breeding</option>
                            <option value="growing">Growing</option>
                        </select>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Add Animal</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveNewAnimal(event) {
        event.preventDefault();
        
        const newAnimal = {
            id: document.getElementById('animalId').value,
            type: document.getElementById('animalType').value,
            breed: document.getElementById('animalBreed').value,
            age: document.getElementById('animalAge').value,
            weight: parseInt(document.getElementById('animalWeight').value),
            location: document.getElementById('animalLocation').value,
            status: document.getElementById('animalStatus').value,
            health: { status: 'healthy', lastCheckup: new Date().toISOString().split('T')[0] },
            photo: 'images/products/sheep-field.jpg',
            dateAdded: new Date().toISOString()
        };

        const livestock = JSON.parse(localStorage.getItem('admin_livestock') || '[]');
        livestock.push(newAnimal);
        localStorage.setItem('admin_livestock', JSON.stringify(livestock));

        // Close modal and refresh view
        document.querySelector('.feedback-modal-overlay').remove();
        this.showLivestockManager();
        this.showNotification('Animal added successfully!', 'success');
    },

    viewAnimal(id) {
        const livestock = JSON.parse(localStorage.getItem('admin_livestock') || '[]');
        const animal = livestock.find(a => a.id === id) || this.getLivestockData().animals.find(a => a.id === id);
        
        if (!animal) {
            alert('Animal not found');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal animal-details">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Animal Details - ${animal.id}</h2>
                
                <div class="animal-profile">
                    <div class="animal-photo-section">
                        <img src="${animal.photo}" alt="${animal.id}" class="animal-detail-photo">
                        <button onclick="adminSystem.updatePhoto('${animal.id}')" class="btn ghost sm">📷 Update Photo</button>
                    </div>
                    
                    <div class="animal-info-section">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Type:</label>
                                <span>${animal.type}</span>
                            </div>
                            <div class="info-item">
                                <label>Breed:</label>
                                <span>${animal.breed}</span>
                            </div>
                            <div class="info-item">
                                <label>Age:</label>
                                <span>${animal.age}</span>
                            </div>
                            <div class="info-item">
                                <label>Weight:</label>
                                <span>${animal.weight}kg</span>
                            </div>
                            <div class="info-item">
                                <label>Location:</label>
                                <span>${animal.location}</span>
                            </div>
                            <div class="info-item">
                                <label>Status:</label>
                                <span class="status-badge status-${animal.status}">${animal.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="animal-records">
                    <div class="record-section">
                        <h3>Health Records</h3>
                        <div class="health-status">
                            <span class="health-badge status-${animal.health.status}">${animal.health.status}</span>
                            <span>Last checkup: ${animal.health.lastCheckup}</span>
                        </div>
                        <button onclick="adminSystem.addHealthRecord('${animal.id}')" class="btn prim sm">🏥 Add Health Record</button>
                    </div>
                    
                    <div class="record-section">
                        <h3>Weight History</h3>
                        <div class="weight-chart">
                            <p>Current: ${animal.weight}kg</p>
                            <p>Goal: ${animal.weight + 5}kg</p>
                        </div>
                        <button onclick="adminSystem.recordWeight('${animal.id}')" class="btn prim sm">⚖️ Record Weight</button>
                    </div>
                </div>

                <div class="animal-actions">
                    <button onclick="adminSystem.editAnimal('${animal.id}')" class="btn secondary">✏️ Edit</button>
                    <button onclick="adminSystem.moveAnimal('${animal.id}')" class="btn secondary">📍 Move</button>
                    <button onclick="adminSystem.sellAnimal('${animal.id}')" class="btn success">💰 Mark for Sale</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    updateHealth(id) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Update Health - ${id}</h2>
                <form onsubmit="adminSystem.saveHealthUpdate(event, '${id}')">
                    <div class="form-group">
                        <label>Health Status</label>
                        <select id="healthStatus" class="feedback-input" required>
                            <option value="healthy">Healthy</option>
                            <option value="sick">Sick</option>
                            <option value="pregnant">Pregnant</option>
                            <option value="recovering">Recovering</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Temperature (°C)</label>
                        <input type="number" id="temperature" class="feedback-input" step="0.1" placeholder="38.5">
                    </div>
                    <div class="form-group">
                        <label>Veterinarian</label>
                        <input type="text" id="veterinarian" class="feedback-input" placeholder="Dr. Ahmed">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="healthNotes" class="feedback-textarea" rows="3" placeholder="Health observations, treatments..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Next Checkup</label>
                        <input type="date" id="nextCheckup" class="feedback-input">
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Save Health Record</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveHealthUpdate(event, animalId) {
        event.preventDefault();
        
        const healthRecord = {
            date: new Date().toISOString().split('T')[0],
            status: document.getElementById('healthStatus').value,
            temperature: document.getElementById('temperature').value,
            veterinarian: document.getElementById('veterinarian').value,
            notes: document.getElementById('healthNotes').value,
            nextCheckup: document.getElementById('nextCheckup').value
        };

        // Update animal health
        const livestock = JSON.parse(localStorage.getItem('admin_livestock') || '[]');
        const animalIndex = livestock.findIndex(a => a.id === animalId);
        
        if (animalIndex !== -1) {
            livestock[animalIndex].health = {
                status: healthRecord.status,
                lastCheckup: healthRecord.date
            };
            livestock[animalIndex].healthRecords = livestock[animalIndex].healthRecords || [];
            livestock[animalIndex].healthRecords.push(healthRecord);
            
            localStorage.setItem('admin_livestock', JSON.stringify(livestock));
        }

        document.querySelector('.feedback-modal-overlay').remove();
        this.showLivestockManager();
        this.showNotification('Health record saved!', 'success');
    },

    recordWeight(id) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Record Weight - ${id}</h2>
                <form onsubmit="adminSystem.saveWeightRecord(event, '${id}')">
                    <div class="form-group">
                        <label>Current Weight (kg)</label>
                        <input type="number" id="currentWeight" class="feedback-input" step="0.1" required>
                    </div>
                    <div class="form-group">
                        <label>Body Condition Score (1-5)</label>
                        <select id="bodyCondition" class="feedback-input">
                            <option value="">Select condition</option>
                            <option value="1">1 - Emaciated</option>
                            <option value="2">2 - Thin</option>
                            <option value="3">3 - Average</option>
                            <option value="4">4 - Good</option>
                            <option value="5">5 - Excellent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="weightNotes" class="feedback-textarea" rows="2" placeholder="Growth observations..."></textarea>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Save Weight Record</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveWeightRecord(event, animalId) {
        event.preventDefault();
        
        const weightRecord = {
            date: new Date().toISOString().split('T')[0],
            weight: parseFloat(document.getElementById('currentWeight').value),
            bodyCondition: document.getElementById('bodyCondition').value,
            notes: document.getElementById('weightNotes').value
        };

        // Update animal weight
        const livestock = JSON.parse(localStorage.getItem('admin_livestock') || '[]');
        const animalIndex = livestock.findIndex(a => a.id === animalId);
        
        if (animalIndex !== -1) {
            livestock[animalIndex].weight = weightRecord.weight;
            livestock[animalIndex].weightHistory = livestock[animalIndex].weightHistory || [];
            livestock[animalIndex].weightHistory.push(weightRecord);
            
            localStorage.setItem('admin_livestock', JSON.stringify(livestock));
        }

        document.querySelector('.feedback-modal-overlay').remove();
        this.showLivestockManager();
        this.showNotification('Weight recorded successfully!', 'success');
    },
    scheduleTask() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Schedule Farm Task</h2>
                <form onsubmit="adminSystem.saveScheduledTask(event)">
                    <div class="form-group">
                        <label>Task Title</label>
                        <input type="text" id="taskTitle" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="taskDescription" class="feedback-textarea" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Task Type</label>
                        <select id="taskType" class="feedback-input" required>
                            <option value="">Select type</option>
                            <option value="feeding">Feeding</option>
                            <option value="veterinary">Veterinary</option>
                            <option value="breeding">Breeding</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="taskDate" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" id="taskTime" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="taskPriority" class="feedback-input">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Schedule Task</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveScheduledTask(event) {
        event.preventDefault();
        
        const task = {
            id: 't_' + Date.now(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            type: document.getElementById('taskType').value,
            date: document.getElementById('taskDate').value,
            time: document.getElementById('taskTime').value,
            priority: document.getElementById('taskPriority').value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
        tasks.push(task);
        localStorage.setItem('farm_tasks', JSON.stringify(tasks));

        document.querySelector('.feedback-modal-overlay').remove();
        this.showFarmOperations();
        this.showNotification('Task scheduled successfully!', 'success');
    },

    recordFeeding() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Record Feeding</h2>
                <form onsubmit="adminSystem.saveFeedingRecord(event)">
                    <div class="form-group">
                        <label>Feed Type</label>
                        <select id="feedType" class="feedback-input" required>
                            <option value="">Select feed type</option>
                            <option value="hay">Hay</option>
                            <option value="grain">Grain</option>
                            <option value="pellets">Pellets</option>
                            <option value="grass">Fresh Grass</option>
                            <option value="supplements">Supplements</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount (kg)</label>
                        <input type="number" id="feedAmount" class="feedback-input" step="0.1" required>
                    </div>
                    <div class="form-group">
                        <label>Animals Fed</label>
                        <select id="animalGroup" class="feedback-input" required>
                            <option value="">Select group</option>
                            <option value="all">All Animals</option>
                            <option value="pen_a">Pen A</option>
                            <option value="pen_b">Pen B</option>
                            <option value="pen_c">Pen C</option>
                            <option value="breeding">Breeding Stock</option>
                            <option value="lambs">Lambs</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Cost ($)</label>
                        <input type="number" id="feedCost" class="feedback-input" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="feedNotes" class="feedback-textarea" rows="2" placeholder="Any observations..."></textarea>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Record Feeding</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveFeedingRecord(event) {
        event.preventDefault();
        
        const feedingRecord = {
            id: 'feed_' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString().split('T')[1].substring(0, 5),
            feedType: document.getElementById('feedType').value,
            amount: parseFloat(document.getElementById('feedAmount').value),
            animalGroup: document.getElementById('animalGroup').value,
            cost: parseFloat(document.getElementById('feedCost').value) || 0,
            notes: document.getElementById('feedNotes').value
        };

        const feedingRecords = JSON.parse(localStorage.getItem('feeding_records') || '[]');
        feedingRecords.push(feedingRecord);
        localStorage.setItem('feeding_records', JSON.stringify(feedingRecords));

        document.querySelector('.feedback-modal-overlay').remove();
        this.showFarmOperations();
        this.showNotification('Feeding recorded successfully!', 'success');
    },

    scheduleVet() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Schedule Veterinary Visit</h2>
                <form onsubmit="adminSystem.saveVetSchedule(event)">
                    <div class="form-group">
                        <label>Veterinarian</label>
                        <input type="text" id="vetName" class="feedback-input" placeholder="Dr. Ahmed Hassan" required>
                    </div>
                    <div class="form-group">
                        <label>Contact</label>
                        <input type="text" id="vetContact" class="feedback-input" placeholder="Phone or email">
                    </div>
                    <div class="form-group">
                        <label>Visit Type</label>
                        <select id="visitType" class="feedback-input" required>
                            <option value="">Select type</option>
                            <option value="routine">Routine Checkup</option>
                            <option value="vaccination">Vaccination</option>
                            <option value="treatment">Treatment</option>
                            <option value="emergency">Emergency</option>
                            <option value="breeding">Breeding Consultation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Animals</label>
                        <select id="vetAnimals" class="feedback-input" required>
                            <option value="">Select animals</option>
                            <option value="all">All Animals</option>
                            <option value="specific">Specific Animals</option>
                            <option value="breeding">Breeding Stock</option>
                            <option value="sick">Sick Animals</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="vetDate" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" id="vetTime" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Estimated Cost ($)</label>
                        <input type="number" id="vetCost" class="feedback-input" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="vetNotes" class="feedback-textarea" rows="3" placeholder="Purpose, special requirements..."></textarea>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Schedule Visit</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveVetSchedule(event) {
        event.preventDefault();
        
        const vetVisit = {
            id: 'vet_' + Date.now(),
            veterinarian: document.getElementById('vetName').value,
            contact: document.getElementById('vetContact').value,
            visitType: document.getElementById('visitType').value,
            animals: document.getElementById('vetAnimals').value,
            date: document.getElementById('vetDate').value,
            time: document.getElementById('vetTime').value,
            estimatedCost: parseFloat(document.getElementById('vetCost').value) || 0,
            notes: document.getElementById('vetNotes').value,
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };

        const vetVisits = JSON.parse(localStorage.getItem('vet_visits') || '[]');
        vetVisits.push(vetVisit);
        localStorage.setItem('vet_visits', JSON.stringify(vetVisits));

        document.querySelector('.feedback-modal-overlay').remove();
        this.showFarmOperations();
        this.showNotification('Veterinary visit scheduled!', 'success');
    },

    recordBreeding() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Record Breeding Activity</h2>
                <form onsubmit="adminSystem.saveBreedingRecord(event)">
                    <div class="form-group">
                        <label>Ram ID</label>
                        <select id="ramId" class="feedback-input" required>
                            <option value="">Select ram</option>
                            <option value="SH-001">SH-001 - Awassi Ram</option>
                            <option value="RAM-002">RAM-002 - Barki Ram</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Ewe ID</label>
                        <select id="eweId" class="feedback-input" required>
                            <option value="">Select ewe</option>
                            <option value="SH-002">SH-002 - Barki Ewe</option>
                            <option value="EWE-003">EWE-003 - Ossimi Ewe</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Breeding Date</label>
                        <input type="date" id="breedingDate" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Method</label>
                        <select id="breedingMethod" class="feedback-input" required>
                            <option value="">Select method</option>
                            <option value="natural">Natural Mating</option>
                            <option value="artificial">Artificial Insemination</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Expected Due Date</label>
                        <input type="date" id="dueDate" class="feedback-input">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="breedingNotes" class="feedback-textarea" rows="3" placeholder="Breeding conditions, observations..."></textarea>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Record Breeding</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveBreedingRecord(event) {
        event.preventDefault();
        
        const breedingRecord = {
            id: 'breed_' + Date.now(),
            ramId: document.getElementById('ramId').value,
            eweId: document.getElementById('eweId').value,
            breedingDate: document.getElementById('breedingDate').value,
            method: document.getElementById('breedingMethod').value,
            expectedDueDate: document.getElementById('dueDate').value,
            notes: document.getElementById('breedingNotes').value,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        const breedingRecords = JSON.parse(localStorage.getItem('breeding_records') || '[]');
        breedingRecords.push(breedingRecord);
        localStorage.setItem('breeding_records', JSON.stringify(breedingRecords));

        // Update ewe status to pregnant if due date is provided
        if (breedingRecord.expectedDueDate) {
            const livestock = JSON.parse(localStorage.getItem('admin_livestock') || '[]');
            const eweIndex = livestock.findIndex(a => a.id === breedingRecord.eweId);
            if (eweIndex !== -1) {
                livestock[eweIndex].status = 'pregnant';
                livestock[eweIndex].health.status = 'pregnant';
                localStorage.setItem('admin_livestock', JSON.stringify(livestock));
            }
        }

        document.querySelector('.feedback-modal-overlay').remove();
        this.showFarmOperations();
        this.showNotification('Breeding activity recorded!', 'success');
    },
    addExpense() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Add Expense</h2>
                <form onsubmit="adminSystem.saveExpense(event)">
                    <div class="form-group">
                        <label>Expense Category</label>
                        <select id="expenseCategory" class="feedback-input" required>
                            <option value="">Select category</option>
                            <option value="feed">Feed & Nutrition</option>
                            <option value="veterinary">Veterinary Care</option>
                            <option value="labor">Labor</option>
                            <option value="utilities">Utilities</option>
                            <option value="equipment">Equipment</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="insurance">Insurance</option>
                            <option value="transportation">Transportation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount ($)</label>
                        <input type="number" id="expenseAmount" class="feedback-input" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="expenseDescription" class="feedback-input" placeholder="Brief description" required>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="expenseDate" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Payment Method</label>
                        <select id="paymentMethod" class="feedback-input">
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="check">Check</option>
                            <option value="credit_card">Credit Card</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Supplier/Vendor</label>
                        <input type="text" id="expenseSupplier" class="feedback-input" placeholder="Supplier name">
                    </div>
                    <div class="form-group">
                        <label>Receipt Number</label>
                        <input type="text" id="receiptNumber" class="feedback-input" placeholder="Receipt/Invoice number">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="expenseNotes" class="feedback-textarea" rows="2" placeholder="Additional details..."></textarea>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Add Expense</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Set today's date as default
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    },

    saveExpense(event) {
        event.preventDefault();
        
        const expense = {
            id: 'exp_' + Date.now(),
            category: document.getElementById('expenseCategory').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            description: document.getElementById('expenseDescription').value,
            date: document.getElementById('expenseDate').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            supplier: document.getElementById('expenseSupplier').value,
            receiptNumber: document.getElementById('receiptNumber').value,
            notes: document.getElementById('expenseNotes').value,
            createdAt: new Date().toISOString()
        };

        const expenses = JSON.parse(localStorage.getItem('farm_expenses') || '[]');
        expenses.push(expense);
        localStorage.setItem('farm_expenses', JSON.stringify(expenses));

        document.querySelector('.feedback-modal-overlay').remove();
        this.showFinancialManager();
        this.showNotification('Expense added successfully!', 'success');
    },

    generateReport() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Generate Financial Report</h2>
                <form onsubmit="adminSystem.createFinancialReport(event)">
                    <div class="form-group">
                        <label>Report Type</label>
                        <select id="reportType" class="feedback-input" required>
                            <option value="">Select report type</option>
                            <option value="monthly">Monthly P&L</option>
                            <option value="quarterly">Quarterly Summary</option>
                            <option value="expense_analysis">Expense Analysis</option>
                            <option value="cash_flow">Cash Flow Statement</option>
                            <option value="tax_summary">Tax Summary</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Period From</label>
                        <input type="date" id="reportDateFrom" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Period To</label>
                        <input type="date" id="reportDateTo" class="feedback-input" required>
                    </div>
                    <div class="form-group">
                        <label>Format</label>
                        <select id="reportFormat" class="feedback-input">
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="csv">CSV</option>
                        </select>
                    </div>
                    <button type="submit" class="feedback-submit btn prim">Generate Report</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Set default dates (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        document.getElementById('reportDateFrom').value = firstDay.toISOString().split('T')[0];
        document.getElementById('reportDateTo').value = lastDay.toISOString().split('T')[0];
    },

    createFinancialReport(event) {
        event.preventDefault();
        
        const reportType = document.getElementById('reportType').value;
        const dateFrom = document.getElementById('reportDateFrom').value;
        const dateTo = document.getElementById('reportDateTo').value;
        const format = document.getElementById('reportFormat').value;
        
        // Generate report based on stored data
        const expenses = JSON.parse(localStorage.getItem('farm_expenses') || '[]');
        const sales = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        
        const filteredExpenses = expenses.filter(e => e.date >= dateFrom && e.date <= dateTo);
        const filteredSales = sales.filter(s => s.date >= dateFrom && s.date <= dateTo);
        
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        
        const reportData = {
            type: reportType,
            period: `${dateFrom} to ${dateTo}`,
            summary: {
                totalRevenue: totalRevenue,
                totalExpenses: totalExpenses,
                netProfit: netProfit,
                profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
            },
            expenses: filteredExpenses,
            sales: filteredSales,
            generatedAt: new Date().toISOString()
        };
        
        document.querySelector('.feedback-modal-overlay').remove();
        this.showReportPreview(reportData);
    },

    showReportPreview(reportData) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal report-preview">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Financial Report Preview</h2>
                
                <div class="report-header">
                    <h3>${reportData.type.replace('_', ' ').toUpperCase()}</h3>
                    <p>Period: ${reportData.period}</p>
                    <p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
                </div>
                
                <div class="report-summary">
                    <h4>Financial Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Total Revenue:</label>
                            <span class="amount positive">$${reportData.summary.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Expenses:</label>
                            <span class="amount negative">$${reportData.summary.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div class="summary-item">
                            <label>Net Profit:</label>
                            <span class="amount ${reportData.summary.netProfit >= 0 ? 'positive' : 'negative'}">
                                $${reportData.summary.netProfit.toLocaleString()}
                            </span>
                        </div>
                        <div class="summary-item">
                            <label>Profit Margin:</label>
                            <span class="amount">${reportData.summary.profitMargin}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-actions">
                    <button onclick="adminSystem.downloadReport('${JSON.stringify(reportData).replace(/"/g, '&quot;')}')" class="btn prim">
                        💾 Download Report
                    </button>
                    <button onclick="adminSystem.emailReport('${JSON.stringify(reportData).replace(/"/g, '&quot;')}')" class="btn secondary">
                        📧 Email Report
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    downloadReport(reportDataStr) {
        const reportData = JSON.parse(reportDataStr.replace(/&quot;/g, '"'));
        
        const csvContent = this.generateCSVReport(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial-report-${reportData.period.replace(/ /g, '-')}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Report downloaded successfully!', 'success');
    },

    generateCSVReport(reportData) {
        let csv = 'Sheep Land Financial Report\n';
        csv += `Type: ${reportData.type}\n`;
        csv += `Period: ${reportData.period}\n`;
        csv += `Generated: ${new Date(reportData.generatedAt).toLocaleString()}\n\n`;
        
        csv += 'FINANCIAL SUMMARY\n';
        csv += `Total Revenue,$${reportData.summary.totalRevenue}\n`;
        csv += `Total Expenses,$${reportData.summary.totalExpenses}\n`;
        csv += `Net Profit,$${reportData.summary.netProfit}\n`;
        csv += `Profit Margin,${reportData.summary.profitMargin}%\n\n`;
        
        if (reportData.expenses.length > 0) {
            csv += 'EXPENSES\n';
            csv += 'Date,Category,Description,Amount,Supplier\n';
            reportData.expenses.forEach(expense => {
                csv += `${expense.date},${expense.category},${expense.description},$${expense.amount},${expense.supplier || ''}\n`;
            });
            csv += '\n';
        }
        
        if (reportData.sales.length > 0) {
            csv += 'SALES\n';
            csv += 'Date,Order ID,Customer,Amount\n';
            reportData.sales.forEach(sale => {
                csv += `${sale.date},${sale.id},${sale.customer?.name || 'Unknown'},$${sale.total || 0}\n`;
            });
        }
        
        return csv;
    },

    emailReport(reportDataStr) {
        alert('Email functionality would be implemented with a backend service.');
    },

    exportReport() {
        const financial = this.getFinancialData();
        const reportData = {
            type: 'current_month',
            period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            summary: {
                totalRevenue: financial.monthlyRevenue,
                totalExpenses: financial.monthlyExpenses,
                netProfit: financial.netProfit,
                profitMargin: financial.profitMargin
            },
            expenses: financial.expenseBreakdown,
            generatedAt: new Date().toISOString()
        };
        
        this.showReportPreview(reportData);
    },
    
    // Helper functions
    filterLivestock() { 
        const status = document.getElementById('livestockStatusFilter').value;
        const type = document.getElementById('livestockTypeFilter').value;
        const search = document.getElementById('livestockSearchFilter').value.toLowerCase();
        
        const rows = document.querySelectorAll('.livestock-row');
        rows.forEach(row => {
            const rowStatus = row.dataset.status;
            const rowType = row.dataset.type;
            const rowText = row.textContent.toLowerCase();
            
            const matchesStatus = !status || rowStatus === status;
            const matchesType = !type || rowType === type;
            const matchesSearch = !search || rowText.includes(search);
            
            row.style.display = matchesStatus && matchesType && matchesSearch ? 'table-row' : 'none';
        });
    },
    
    toggleTask(id) { 
        // Toggle task completion
        const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
        const taskIndex = tasks.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            localStorage.setItem('farm_tasks', JSON.stringify(tasks));
            this.showFarmOperations(); // Refresh view
        }
    },

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification?.remove();
        }, 3000);
    },

    // Additional livestock functions
    editAnimal(id) {
        alert(`Edit animal ${id} feature coming soon!`);
    },

    moveAnimal(id) {
        alert(`Move animal ${id} feature coming soon!`);
    },

    sellAnimal(id) {
        alert(`Mark animal ${id} for sale feature coming soon!`);
    },

    updatePhoto(id) {
        alert(`Update photo for ${id} feature coming soon!`);
    },

    addHealthRecord(id) {
        this.updateHealth(id); // Reuse existing function
    },

    // Business report generation functions
    generateSalesReport() {
        const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyOrders = orders.filter(o => o.date && o.date.startsWith(currentMonth));
        
        const reportData = {
            title: 'Sales Performance Report',
            period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            totalRevenue: monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            totalOrders: monthlyOrders.length,
            avgOrderValue: monthlyOrders.length > 0 ? (monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0) / monthlyOrders.length).toFixed(2) : 0,
            topProducts: this.getTopProducts(monthlyOrders),
            customerInsights: this.getCustomerInsights(monthlyOrders)
        };
        
        this.showReportModal(reportData);
    },

    generateLivestockReport() {
        const livestock = this.getLivestockData();
        const healthRecords = JSON.parse(localStorage.getItem('admin_livestock') || '[]')
            .filter(animal => animal.healthRecords && animal.healthRecords.length > 0);
        
        const reportData = {
            title: 'Livestock Management Report',
            period: 'Current Status',
            totalAnimals: livestock.total,
            healthyAnimals: livestock.animals.filter(a => a.health.status === 'healthy').length,
            pregnantAnimals: livestock.animals.filter(a => a.health.status === 'pregnant').length,
            avgWeight: Math.round(livestock.animals.reduce((sum, a) => sum + a.weight, 0) / livestock.animals.length),
            breedDistribution: this.getBreedDistribution(livestock.animals),
            healthAlerts: livestock.animals.filter(a => a.health.status === 'sick').length
        };
        
        this.showReportModal(reportData);
    },

    generateForecastReport() {
        const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        const expenses = JSON.parse(localStorage.getItem('farm_expenses') || '[]');
        const livestock = this.getLivestockData();
        
        // Simple forecasting based on historical data
        const monthlyData = this.getMonthlyTrends(orders, expenses);
        const forecast = this.calculateForecast(monthlyData);
        
        const reportData = {
            title: 'Business Forecast & Projections',
            period: 'Next 6 Months Projection',
            currentRevenue: monthlyData.currentRevenue,
            projectedRevenue: forecast.projectedRevenue,
            growthRate: forecast.growthRate,
            seasonalTrends: forecast.seasonalTrends,
            livestockProjections: this.calculateLivestockForecast(livestock),
            recommendations: this.getBusinessRecommendations(forecast)
        };
        
        this.showForecastModal(reportData);
    },

    generateSupplierReport() {
        const suppliers = this.getSupplierData();
        const expenses = JSON.parse(localStorage.getItem('farm_expenses') || '[]');
        
        const supplierPerformance = suppliers.list.map(supplier => {
            const supplierExpenses = expenses.filter(e => e.supplier === supplier.name);
            const totalSpent = supplierExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            return {
                ...supplier,
                totalSpent: totalSpent,
                transactionCount: supplierExpenses.length,
                avgTransactionValue: supplierExpenses.length > 0 ? totalSpent / supplierExpenses.length : 0,
                performance: this.calculateSupplierPerformance(supplier, supplierExpenses)
            };
        });
        
        const reportData = {
            title: 'Supplier Performance Analysis',
            period: 'Current Period',
            totalSuppliers: suppliers.total,
            totalSpend: suppliers.monthlySpend,
            topSupplier: supplierPerformance.reduce((top, current) => 
                current.totalSpent > top.totalSpent ? current : top, supplierPerformance[0]),
            supplierRankings: supplierPerformance.sort((a, b) => b.performance - a.performance),
            costSavings: this.identifyCostSavings(supplierPerformance)
        };
        
        this.showReportModal(reportData);
    },

    generateOperationsReport() {
        const tasks = JSON.parse(localStorage.getItem('farm_tasks') || '[]');
        const feedingRecords = JSON.parse(localStorage.getItem('feeding_records') || '[]');
        const vetVisits = JSON.parse(localStorage.getItem('vet_visits') || '[]');
        
        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.date);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return taskDate >= weekAgo;
        });
        
        const reportData = {
            title: 'Farm Operations Report',
            period: 'Last 7 Days',
            tasksCompleted: weekTasks.filter(t => t.completed).length,
            totalTasks: weekTasks.length,
            completionRate: weekTasks.length > 0 ? Math.round((weekTasks.filter(t => t.completed).length / weekTasks.length) * 100) : 0,
            feedingCost: feedingRecords.reduce((sum, f) => sum + (f.cost || 0), 0),
            vetVisitsScheduled: vetVisits.filter(v => v.status === 'scheduled').length,
            efficiency: this.calculateOperationalEfficiency(tasks, feedingRecords, vetVisits)
        };
        
        this.showReportModal(reportData);
    },

    // Helper functions for reports
    getTopProducts(orders) {
        const productCounts = {};
        orders.forEach(order => {
            order.items?.forEach(item => {
                productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
            });
        });
        
        return Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([name, quantity]) => ({ name, quantity }));
    },

    getCustomerInsights(orders) {
        const customers = {};
        orders.forEach(order => {
            const customerName = order.customer?.name || 'Unknown';
            customers[customerName] = (customers[customerName] || 0) + (order.total || 0);
        });
        
        return {
            totalCustomers: Object.keys(customers).length,
            topCustomer: Object.entries(customers).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
            avgCustomerValue: Object.values(customers).reduce((sum, val) => sum + val, 0) / Math.max(Object.keys(customers).length, 1)
        };
    },

    getBreedDistribution(animals) {
        const breeds = {};
        animals.forEach(animal => {
            breeds[animal.breed] = (breeds[animal.breed] || 0) + 1;
        });
        return breeds;
    },

    getMonthlyTrends(orders, expenses) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyOrders = orders.filter(o => o.date && o.date.startsWith(currentMonth));
        const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
        
        return {
            currentRevenue: monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            currentExpenses: monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
            orderCount: monthlyOrders.length,
            avgOrderValue: monthlyOrders.length > 0 ? monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0) / monthlyOrders.length : 0
        };
    },

    calculateForecast(monthlyData) {
        // Simple growth projection based on current trends
        const growthRate = 15; // Assumed 15% monthly growth
        const seasonalMultiplier = this.getSeasonalMultiplier();
        
        return {
            projectedRevenue: Math.round(monthlyData.currentRevenue * (1 + growthRate / 100) * seasonalMultiplier),
            growthRate: growthRate,
            seasonalTrends: {
                'Eid Al-Adha': '+300%',
                'Ramadan': '+150%',
                'Summer': '+50%',
                'Winter': '-20%'
            }
        };
    },

    getSeasonalMultiplier() {
        const month = new Date().getMonth();
        // Adjust based on Islamic calendar events (simplified)
        if (month >= 5 && month <= 7) return 2.5; // Eid season
        if (month >= 2 && month <= 4) return 1.5; // Ramadan season
        return 1.0;
    },

    calculateLivestockForecast(livestock) {
        const pregnantAnimals = livestock.animals.filter(a => a.status === 'pregnant').length;
        const expectedBirths = Math.round(pregnantAnimals * 0.85); // 85% success rate
        
        return {
            expectedBirths: expectedBirths,
            projectedHerdSize: livestock.total + expectedBirths,
            readyForSaleIn6Months: Math.round(livestock.total * 0.3),
            feedRequirements: Math.round((livestock.total + expectedBirths) * 30) // kg per month
        };
    },

    getBusinessRecommendations(forecast) {
        return [
            'Increase inventory by 25% ahead of Eid season',
            'Consider expanding breeding program to meet demand',
            'Negotiate better feed prices for projected volume',
            'Plan marketing campaigns for seasonal peaks'
        ];
    },

    calculateSupplierPerformance(supplier, expenses) {
        // Simple performance score based on price, reliability, and rating
        const avgCost = expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0;
        const priceScore = avgCost > 0 ? Math.max(0, 100 - (avgCost / 100)) : 50;
        const ratingScore = supplier.rating * 20; // Convert 5-star to 100-point scale
        
        return Math.round((priceScore + ratingScore) / 2);
    },

    identifyCostSavings(suppliers) {
        const totalSpend = suppliers.reduce((sum, s) => sum + s.totalSpent, 0);
        const potentialSavings = totalSpend * 0.1; // Assume 10% potential savings
        
        return {
            amount: Math.round(potentialSavings),
            recommendations: [
                'Negotiate volume discounts with top suppliers',
                'Compare prices across suppliers monthly',
                'Consider long-term contracts for stable pricing'
            ]
        };
    },

    calculateOperationalEfficiency(tasks, feeding, vet) {
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const taskEfficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
        
        const feedingEfficiency = feeding.length > 0 ? 90 : 75; // Assume good efficiency if feeding tracked
        const vetEfficiency = vet.length > 0 ? 85 : 70; // Assume good efficiency if vet visits tracked
        
        return Math.round((taskEfficiency + feedingEfficiency + vetEfficiency) / 3);
    },

    // Report display functions
    showReportModal(reportData) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal report-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>${reportData.title}</h2>
                
                <div class="report-summary">
                    <h3>Summary for ${reportData.period}</h3>
                    <div class="report-metrics">
                        ${Object.entries(reportData).filter(([key]) => 
                            !['title', 'period'].includes(key)
                        ).map(([key, value]) => `
                            <div class="metric-item">
                                <span class="metric-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                <span class="metric-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="report-actions">
                    <button onclick="adminSystem.downloadReportData('${JSON.stringify(reportData).replace(/"/g, '&quot;')}')" class="btn prim">
                        💾 Download Report
                    </button>
                    <button onclick="this.parentElement.parentElement.remove()" class="btn secondary">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showForecastModal(reportData) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal forecast-modal">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>${reportData.title}</h2>
                
                <div class="forecast-sections">
                    <div class="forecast-section">
                        <h3>Revenue Forecast</h3>
                        <div class="forecast-chart">
                            <div class="chart-item">
                                <span class="chart-label">Current Month:</span>
                                <span class="chart-value">$${reportData.currentRevenue.toLocaleString()}</span>
                            </div>
                            <div class="chart-item">
                                <span class="chart-label">Projected Next Month:</span>
                                <span class="chart-value positive">$${reportData.projectedRevenue.toLocaleString()}</span>
                            </div>
                            <div class="chart-item">
                                <span class="chart-label">Growth Rate:</span>
                                <span class="chart-value">${reportData.growthRate}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="forecast-section">
                        <h3>Seasonal Trends</h3>
                        <div class="seasonal-chart">
                            ${Object.entries(reportData.seasonalTrends).map(([season, change]) => `
                                <div class="season-item">
                                    <span class="season-name">${season}:</span>
                                    <span class="season-change ${change.includes('+') ? 'positive' : 'negative'}">${change}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="forecast-section">
                        <h3>Livestock Projections</h3>
                        <div class="livestock-forecast">
                            <div class="forecast-metric">
                                <label>Expected Births:</label>
                                <span>${reportData.livestockProjections.expectedBirths}</span>
                            </div>
                            <div class="forecast-metric">
                                <label>Projected Herd Size:</label>
                                <span>${reportData.livestockProjections.projectedHerdSize}</span>
                            </div>
                            <div class="forecast-metric">
                                <label>Ready for Sale (6 months):</label>
                                <span>${reportData.livestockProjections.readyForSaleIn6Months}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="forecast-section">
                        <h3>Business Recommendations</h3>
                        <div class="recommendations">
                            ${reportData.recommendations.map(rec => `
                                <div class="recommendation-item">
                                    <span class="rec-icon">💡</span>
                                    <span class="rec-text">${rec}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="report-actions">
                    <button onclick="adminSystem.downloadReportData('${JSON.stringify(reportData).replace(/"/g, '&quot;')}')" class="btn prim">
                        💾 Download Forecast
                    </button>
                    <button onclick="this.parentElement.parentElement.remove()" class="btn secondary">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    downloadReportData(reportDataStr) {
        const reportData = JSON.parse(reportDataStr.replace(/&quot;/g, '"'));
        const csvContent = this.generateReportCSV(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Report downloaded successfully!', 'success');
    },

    generateReportCSV(reportData) {
        let csv = `${reportData.title}\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Period: ${reportData.period}\n\n`;
        
        Object.entries(reportData).forEach(([key, value]) => {
            if (!['title', 'period'].includes(key)) {
                csv += `${key},${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
            }
        });
        
        return csv;
    },
};

// Initialize admin system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if admin mode is enabled
    if (window.location.hash.includes('admin') || localStorage.getItem('admin_mode') === 'true') {
        console.log('🐑 Admin System: Admin mode activated');
        localStorage.setItem('admin_mode', 'true');
        // Wait a bit for other systems to initialize
        setTimeout(() => {
            adminSystem.init();
        }, 100);
    }
});

// Listen for hash changes to enable admin mode
window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('admin') && localStorage.getItem('admin_mode') !== 'true') {
        console.log('🐑 Admin System: Admin mode activated via URL');
        localStorage.setItem('admin_mode', 'true');
        adminSystem.init();
    }
});

// Also check immediately if page loads with #admin hash
if (window.location.hash.includes('admin')) {
    localStorage.setItem('admin_mode', 'true');
    // Wait for DOM to be ready if not already
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            adminSystem.init();
        });
    } else {
        adminSystem.init();
    }
}

// Global admin toggle function
window.toggleAdminMode = function() {
    const isEnabled = localStorage.getItem('admin_mode') === 'true';
    if (isEnabled) {
        localStorage.removeItem('admin_mode');
        document.querySelector('.main-admin-panel')?.remove();
        alert('Admin mode disabled. Refresh page to see changes.');
    } else {
        localStorage.setItem('admin_mode', 'true');
        adminSystem.init();
        alert('Admin mode enabled!');
    }
};

// Export for global use
window.adminSystem = adminSystem;