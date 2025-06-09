// Feedback & Customer Satisfaction System for Sheep.land
const feedbackSystem = {
    // Initialize feedback system
    init() {
        this.setupFeedbackWidget();
        this.loadExistingFeedback();
        this.setupEventListeners();
        this.checkForDirectFeedbackLink();
    },

    // Check if page was loaded with feedback parameters
    checkForDirectFeedbackLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const feedbackToken = urlParams.get('feedback');
        const orderId = urlParams.get('order');
        const customerName = urlParams.get('customer');
        
        if (feedbackToken) {
            // Auto-open feedback modal when accessed via direct link
            setTimeout(() => {
                this.openFeedbackModal('direct_link', orderId, customerName);
            }, 1000);
        }
    },

    // Create floating feedback button
    setupFeedbackWidget() {
        const widget = document.createElement('div');
        widget.className = 'feedback-widget';
        widget.innerHTML = `
            <button class="feedback-trigger" onclick="feedbackSystem.openFeedbackModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span class="feedback-label">Feedback</span>
            </button>
        `;
        document.body.appendChild(widget);
        
        // Add admin controls (hidden by default)
        this.setupAdminControls();
    },

    // Setup admin controls
    setupAdminControls() {
        // Check if admin mode should be enabled (you can add authentication later)
        const isAdminMode = window.location.hash.includes('admin') || localStorage.getItem('feedback_admin_mode') === 'true';
        
        if (isAdminMode) {
            const adminPanel = document.createElement('div');
            adminPanel.className = 'admin-feedback-panel';
            adminPanel.innerHTML = `
                <div class="admin-panel-toggle" onclick="feedbackSystem.toggleAdminPanel()">
                    <span>⚙️ Admin</span>
                </div>
                <div class="admin-panel-content" id="adminPanelContent" style="display:none;">
                    <button onclick="feedbackSystem.showDashboard()" class="admin-btn">
                        📊 Analytics
                    </button>
                    <button onclick="feedbackSystem.showLinkGenerator()" class="admin-btn">
                        🔗 Generate Links
                    </button>
                    <button onclick="feedbackSystem.showTestimonialManager()" class="admin-btn">
                        ⭐ Manage Testimonials
                    </button>
                    <button onclick="feedbackSystem.showFeedbackManager()" class="admin-btn">
                        💬 Manage Feedback
                    </button>
                    <button onclick="feedbackSystem.showSettingsPanel()" class="admin-btn">
                        ⚙️ Settings
                    </button>
                    <button onclick="feedbackSystem.exportFeedback()" class="admin-btn">
                        💾 Export Data
                    </button>
                    <button onclick="feedbackSystem.toggleAdminMode()" class="admin-btn small">
                        👁️ Hide Admin
                    </button>
                </div>
            `;
            document.body.appendChild(adminPanel);
        }
    },

    // Toggle admin panel visibility
    toggleAdminPanel() {
        const content = document.getElementById('adminPanelContent');
        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
    },

    // Toggle admin mode on/off
    toggleAdminMode() {
        const isEnabled = localStorage.getItem('feedback_admin_mode') === 'true';
        if (isEnabled) {
            localStorage.removeItem('feedback_admin_mode');
            document.querySelector('.admin-feedback-panel')?.remove();
            alert('Admin mode disabled. Refresh page to see changes.');
        } else {
            localStorage.setItem('feedback_admin_mode', 'true');
            this.setupAdminControls();
            alert('Admin mode enabled!');
        }
    },

    // Export feedback data
    async exportFeedback() {
        let feedbacks = [];
        let testimonials = [];
        
        try {
            // Try to load from PocketBase first
            if (window.pb && window.pb.authStore.isValid) {
                const feedbackRecords = await window.pb.collection('customer_feedback').getList(1, 1000, {
                    sort: '-created'
                });
                feedbacks = feedbackRecords.items;
                
                const testimonialRecords = await window.pb.collection('customer_feedback').getList(1, 100, {
                    filter: 'isPublished = true && rating >= 4',
                    sort: '-created'
                });
                testimonials = testimonialRecords.items;
            } else {
                // Fallback to localStorage
                feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
                testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
            }
        } catch (error) {
            console.error('Error loading data for export:', error);
            feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
            testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
        }
        
        const exportData = {
            feedbacks: feedbacks,
            testimonials: testimonials,
            stats: await this.getStatistics(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `feedback-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Feedback data exported!', 'success');
    },

    // Open feedback modal
    openFeedbackModal(context = 'general', orderId = null, customerName = null) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" onclick="feedbackSystem.closeFeedbackModal()">×</button>
                <h2 class="feedback-title bil-row">
                    <span class="en">We'd love your feedback!</span>
                    <span class="ar">نحب أن نسمع رأيك!</span>
                </h2>
                
                <!-- Quick CSAT Rating -->
                <div class="csat-section">
                    <p class="csat-question bil-row">
                        <span class="en">How was your experience?</span>
                        <span class="ar">كيف كانت تجربتك؟</span>
                    </p>
                    <div class="csat-ratings">
                        <button class="csat-emoji" data-rating="1" onclick="feedbackSystem.selectRating(1)">
                            😢
                            <span class="csat-label bil-inline">
                                <span class="en">Poor</span>
                                <span class="ar">سيء</span>
                            </span>
                        </button>
                        <button class="csat-emoji" data-rating="2" onclick="feedbackSystem.selectRating(2)">
                            😕
                            <span class="csat-label bil-inline">
                                <span class="en">Fair</span>
                                <span class="ar">مقبول</span>
                            </span>
                        </button>
                        <button class="csat-emoji" data-rating="3" onclick="feedbackSystem.selectRating(3)">
                            😐
                            <span class="csat-label bil-inline">
                                <span class="en">Good</span>
                                <span class="ar">جيد</span>
                            </span>
                        </button>
                        <button class="csat-emoji" data-rating="4" onclick="feedbackSystem.selectRating(4)">
                            😊
                            <span class="csat-label bil-inline">
                                <span class="en">Great</span>
                                <span class="ar">ممتاز</span>
                            </span>
                        </button>
                        <button class="csat-emoji" data-rating="5" onclick="feedbackSystem.selectRating(5)">
                            🤩
                            <span class="csat-label bil-inline">
                                <span class="en">Excellent</span>
                                <span class="ar">رائع</span>
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Feedback Categories -->
                <div class="feedback-categories" id="feedbackCategories" style="display:none;">
                    <p class="category-question bil-row">
                        <span class="en">What's your feedback about?</span>
                        <span class="ar">ما هو موضوع ملاحظاتك؟</span>
                    </p>
                    <div class="category-buttons">
                        <button class="category-btn" onclick="feedbackSystem.selectCategory('product')">
                            <span class="bil-inline">
                                <span class="en">Product Quality</span>
                                <span class="ar">جودة المنتج</span>
                            </span>
                        </button>
                        <button class="category-btn" onclick="feedbackSystem.selectCategory('delivery')">
                            <span class="bil-inline">
                                <span class="en">Delivery</span>
                                <span class="ar">التوصيل</span>
                            </span>
                        </button>
                        <button class="category-btn" onclick="feedbackSystem.selectCategory('service')">
                            <span class="bil-inline">
                                <span class="en">Customer Service</span>
                                <span class="ar">خدمة العملاء</span>
                            </span>
                        </button>
                        <button class="category-btn" onclick="feedbackSystem.selectCategory('website')">
                            <span class="bil-inline">
                                <span class="en">Website</span>
                                <span class="ar">الموقع</span>
                            </span>
                        </button>
                        <button class="category-btn" onclick="feedbackSystem.selectCategory('price')">
                            <span class="bil-inline">
                                <span class="en">Pricing</span>
                                <span class="ar">الأسعار</span>
                            </span>
                        </button>
                        <button class="category-btn" onclick="feedbackSystem.selectCategory('other')">
                            <span class="bil-inline">
                                <span class="en">Other</span>
                                <span class="ar">أخرى</span>
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Detailed Feedback Form -->
                <div class="feedback-form" id="feedbackForm" style="display:none;">
                    <form onsubmit="feedbackSystem.submitFeedback(event)">
                        <div class="form-group">
                            <label class="bil-row">
                                <span class="en">Tell us more (optional)</span>
                                <span class="ar">أخبرنا المزيد (اختياري)</span>
                            </label>
                            <textarea 
                                id="feedbackText" 
                                rows="4" 
                                class="feedback-textarea"
                                placeholder="Share your thoughts..."
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label class="bil-row">
                                <span class="en">Your Name (optional)</span>
                                <span class="ar">اسمك (اختياري)</span>
                            </label>
                            <input type="text" id="feedbackName" class="feedback-input" value="${customerName || ''}">
                        </div>

                        <div class="form-group">
                            <label class="bil-row">
                                <span class="en">Email (optional)</span>
                                <span class="ar">البريد الإلكتروني (اختياري)</span>
                            </label>
                            <input type="email" id="feedbackEmail" class="feedback-input">
                        </div>

                        <div class="form-group">
                            <label class="bil-row">
                                <span class="en">Phone Number (optional)</span>
                                <span class="ar">رقم الهاتف (اختياري)</span>
                            </label>
                            <input type="tel" id="feedbackPhone" class="feedback-input" placeholder="+20...">
                        </div>

                        <div class="form-group">
                            <label class="feedback-checkbox">
                                <input type="checkbox" id="allowTestimonial">
                                <span class="bil-inline">
                                    <span class="en">You may use my feedback as a testimonial</span>
                                    <span class="ar">يمكنكم استخدام رأيي كشهادة</span>
                                </span>
                            </label>
                        </div>

                        <button type="submit" class="feedback-submit btn prim">
                            <span class="bil-inline">
                                <span class="en">Submit Feedback</span>
                                <span class="ar">إرسال الملاحظات</span>
                            </span>
                        </button>
                    </form>
                </div>

                <!-- Thank You Message -->
                <div class="feedback-success" id="feedbackSuccess" style="display:none;">
                    <div class="success-icon">✅</div>
                    <h3 class="bil-row">
                        <span class="en">Thank you for your feedback!</span>
                        <span class="ar">شكراً لك على ملاحظاتك!</span>
                    </h3>
                    <p class="bil-row">
                        <span class="en">Your opinion helps us improve our service.</span>
                        <span class="ar">رأيك يساعدنا على تحسين خدمتنا.</span>
                    </p>
                </div>

                <!-- Hidden fields -->
                <input type="hidden" id="feedbackRating" value="">
                <input type="hidden" id="feedbackCategory" value="">
                <input type="hidden" id="feedbackContext" value="${context}">
                <input type="hidden" id="feedbackOrderId" value="${orderId || ''}">
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add fade-in animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    },

    // Close feedback modal
    closeFeedbackModal() {
        const modal = document.querySelector('.feedback-modal-overlay');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },

    // Handle rating selection
    selectRating(rating) {
        // Update rating buttons
        document.querySelectorAll('.csat-emoji').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.rating == rating);
        });
        
        // Store rating
        document.getElementById('feedbackRating').value = rating;
        
        // Show categories
        document.getElementById('feedbackCategories').style.display = 'block';
        
        // Auto-scroll to categories
        const categories = document.getElementById('feedbackCategories');
        categories.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    // Handle category selection
    selectCategory(category) {
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            const btnCategory = btn.onclick.toString().match(/'([^']+)'/)[1];
            btn.classList.toggle('selected', btnCategory === category);
        });
        
        // Store category
        document.getElementById('feedbackCategory').value = category;
        
        // Show form
        document.getElementById('feedbackForm').style.display = 'block';
        
        // Auto-scroll to form
        const form = document.getElementById('feedbackForm');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    // Submit feedback
    async submitFeedback(event) {
        event.preventDefault();
        
        const rating = parseInt(document.getElementById('feedbackRating').value);
        const feedbackData = {
            rating: rating,
            category: document.getElementById('feedbackCategory').value,
            message: document.getElementById('feedbackText').value,
            name: document.getElementById('feedbackName').value,
            email: document.getElementById('feedbackEmail').value,
            phone: document.getElementById('feedbackPhone').value,
            allowTestimonial: document.getElementById('allowTestimonial').checked,
            orderType: document.getElementById('feedbackContext').value,
            orderNumber: document.getElementById('feedbackOrderId').value,
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
            wouldRecommend: rating >= 4 ? 'yes' : (rating >= 3 ? 'maybe' : 'no'),
            isPublished: false
        };

        try {
            // Store in PocketBase
            if (window.pb) {
                await window.pb.collection('customer_feedback').create(feedbackData);
                
                // Also store in localStorage for offline access
                const feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
                feedbacks.push({...feedbackData, created_at: new Date().toISOString()});
                localStorage.setItem('sheepland_feedbacks', JSON.stringify(feedbacks));
            } else {
                // Fallback to localStorage only
                const feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
                feedbacks.push({...feedbackData, created_at: new Date().toISOString()});
                localStorage.setItem('sheepland_feedbacks', JSON.stringify(feedbacks));
            }

            // Show success message
            document.getElementById('feedbackForm').style.display = 'none';
            document.getElementById('feedbackCategories').style.display = 'none';
            document.getElementById('feedbackSuccess').style.display = 'block';

            // Trigger analytics event
            if (window.gtag) {
                window.gtag('event', 'feedback_submitted', {
                    rating: feedbackData.rating,
                    category: feedbackData.category
                });
            }

            // Close modal after delay
            setTimeout(() => this.closeFeedbackModal(), 2000);

            // If high rating and testimonial allowed, add to testimonials
            if (feedbackData.rating >= 4 && feedbackData.allowTestimonial && feedbackData.message) {
                this.addTestimonial(feedbackData);
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Sorry, there was an error submitting your feedback. Please try again.');
        }
    },

    // Add testimonial to display
    addTestimonial(feedback) {
        const testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
        testimonials.unshift({
            name: feedback.name || 'Valued Customer',
            rating: feedback.rating,
            text: feedback.text,
            date: feedback.created_at,
            category: feedback.category
        });
        // Keep only last 20 testimonials
        testimonials.splice(20);
        localStorage.setItem('sheepland_testimonials', JSON.stringify(testimonials));
    },

    // Load existing feedback/testimonials
    async loadExistingFeedback() {
        try {
            // Try to load from PocketBase first
            if (window.pb && window.pb.authStore.isValid) {
                const records = await window.pb.collection('customer_feedback').getList(1, 20, {
                    filter: 'isPublished = true && rating >= 4',
                    sort: '-created'
                });
                
                if (records.items.length > 0) {
                    const testimonials = records.items.map(item => ({
                        name: item.name || 'Valued Customer',
                        rating: item.rating,
                        text: item.message,
                        date: item.created,
                        category: item.category
                    }));
                    this.displayTestimonials(testimonials);
                    return;
                }
            }
        } catch (error) {
            console.log('Could not load testimonials from PocketBase:', error);
        }
        
        // Fallback to localStorage
        let testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
        
        // Add some sample testimonials if none exist
        if (testimonials.length === 0) {
            testimonials = [
                {
                    name: 'Sarah Ahmed',
                    rating: 5,
                    text: 'Amazing quality meat and perfect timing for our family gathering. Will definitely order again!',
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    category: 'product'
                },
                {
                    name: 'Mohamed Ali',
                    rating: 5,
                    text: 'Best Udheya service in Egypt. Professional, reliable, and follows all religious requirements.',
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    category: 'service'
                },
                {
                    name: 'Fatima Hassan',
                    rating: 4,
                    text: 'Great customer service and the website is easy to use. Delivery was on time.',
                    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                    category: 'delivery'
                }
            ];
            localStorage.setItem('sheepland_testimonials', JSON.stringify(testimonials));
        }
        
        if (testimonials.length > 0) {
            this.displayTestimonials(testimonials);
        }
    },

    // Display testimonials on page (kept for admin use only)
    displayTestimonials(testimonials) {
        // No longer display testimonials on public page
        // This function is kept for potential admin panel use
        console.log('Testimonials loaded:', testimonials.length);
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for order completion to show feedback prompt
        window.addEventListener('orderCompleted', (e) => {
            setTimeout(() => {
                this.showOrderFeedbackPrompt(e.detail.orderId);
            }, 2000);
        });

        // Listen for ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFeedbackModal();
            }
        });
    },

    // Show feedback prompt after order
    showOrderFeedbackPrompt(orderId) {
        const prompt = document.createElement('div');
        prompt.className = 'feedback-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <p class="bil-row">
                    <span class="en">How was your ordering experience?</span>
                    <span class="ar">كيف كانت تجربة طلبك؟</span>
                </p>
                <button class="btn prim sm" onclick="feedbackSystem.openFeedbackModal('order', '${orderId}')">
                    <span class="bil-inline">
                        <span class="en">Give Feedback</span>
                        <span class="ar">شارك رأيك</span>
                    </span>
                </button>
                <button class="btn ghost sm" onclick="this.parentElement.parentElement.remove()">
                    <span class="bil-inline">
                        <span class="en">Later</span>
                        <span class="ar">لاحقاً</span>
                    </span>
                </button>
            </div>
        `;
        document.body.appendChild(prompt);
        
        // Auto-remove after 10 seconds
        setTimeout(() => prompt.remove(), 10000);
    },

    // Get feedback statistics
    async getStatistics() {
        let feedbacks = [];
        
        try {
            // Try to load from PocketBase first
            if (window.pb && window.pb.authStore.isValid) {
                const records = await window.pb.collection('customer_feedback').getList(1, 1000);
                feedbacks = records.items;
            } else {
                feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
            }
        } catch (error) {
            console.error('Error loading feedback for statistics:', error);
            feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
        }
        
        if (feedbacks.length === 0) return null;

        const stats = {
            total: feedbacks.length,
            averageRating: feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length,
            byCategory: {},
            byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            satisfaction: 0,
            recentFeedback: feedbacks.slice(-5).reverse()
        };

        feedbacks.forEach(f => {
            stats.byRating[f.rating]++;
            stats.byCategory[f.category] = (stats.byCategory[f.category] || 0) + 1;
        });

        // Calculate satisfaction percentage (rating 4-5 as satisfied)
        const satisfied = stats.byRating[4] + stats.byRating[5];
        stats.satisfaction = feedbacks.length > 0 ? Math.round((satisfied / feedbacks.length) * 100) : 0;

        return stats;
    },

    // Show feedback dashboard (for admin/analytics)
    showDashboard() {
        const stats = this.getStatistics();
        if (!stats) {
            alert('No feedback data available yet.');
            return;
        }

        const dashboard = document.createElement('div');
        dashboard.className = 'feedback-dashboard-overlay';
        dashboard.innerHTML = `
            <div class="feedback-dashboard">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Feedback Analytics Dashboard</h2>
                
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <h3>Total Feedback</h3>
                        <p class="stat-number">${stats.total}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Average Rating</h3>
                        <p class="stat-number">${stats.averageRating.toFixed(1)} / 5</p>
                    </div>
                    <div class="stat-card">
                        <h3>Satisfaction Rate</h3>
                        <p class="stat-number">${stats.satisfaction}%</p>
                    </div>
                </div>

                <div class="dashboard-charts">
                    <div class="chart-section">
                        <h3>Ratings Distribution</h3>
                        <div class="rating-bars">
                            ${[5,4,3,2,1].map(rating => `
                                <div class="rating-bar">
                                    <span>${rating} ⭐</span>
                                    <div class="bar">
                                        <div class="bar-fill" style="width: ${stats.total > 0 ? (stats.byRating[rating] / stats.total * 100) : 0}%"></div>
                                    </div>
                                    <span>${stats.byRating[rating]}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="chart-section">
                        <h3>Feedback by Category</h3>
                        <div class="category-list">
                            ${Object.entries(stats.byCategory).map(([cat, count]) => `
                                <div class="category-item">
                                    <span>${cat}</span>
                                    <span class="count">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="recent-feedback">
                    <h3>Recent Feedback</h3>
                    ${stats.recentFeedback.map(f => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span class="rating">${'⭐'.repeat(f.rating)}</span>
                                <span class="category">${f.category}</span>
                                <span class="date">${new Date(f.created_at).toLocaleDateString()}</span>
                            </div>
                            <p class="feedback-text">${f.text || 'No comment provided'}</p>
                            <p class="feedback-author">${f.name || 'Anonymous'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(dashboard);
    },

    // Generate feedback link for sharing
    generateFeedbackLink(orderId = null, customerName = null, customerEmail = null) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        // Generate unique feedback token
        const feedbackToken = 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        params.set('feedback', feedbackToken);
        
        if (orderId) params.set('order', orderId);
        if (customerName) params.set('customer', encodeURIComponent(customerName));
        if (customerEmail) params.set('email', encodeURIComponent(customerEmail));
        
        return `${baseUrl}?${params.toString()}`;
    },

    // Generate WhatsApp message with feedback link
    generateWhatsAppMessage(orderId, customerName, customerPhone) {
        const feedbackLink = this.generateFeedbackLink(orderId, customerName);
        const shortLink = this.shortenUrl(feedbackLink);
        
        const message = encodeURIComponent(`🐑 شكراً لك ${customerName || 'عزيزنا العميل'} لطلبك من أرض الأغنام!

نحن نقدر رأيك ونود سماع تجربتك معنا.

⭐ شارك تقييمك هنا: ${shortLink}

يستغرق دقيقة واحدة فقط ويساعدنا في تحسين خدمتنا 🙏

---
Thank you ${customerName || 'valued customer'} for your order from Sheep Land!

We value your opinion and would love to hear about your experience.

⭐ Share your feedback here: ${shortLink}

Takes just one minute and helps us improve our service 🙏`);

        return `https://wa.me/${customerPhone}?text=${message}`;
    },

    // Generate SMS message with feedback link
    generateSMSMessage(orderId, customerName) {
        const feedbackLink = this.generateFeedbackLink(orderId, customerName);
        const shortLink = this.shortenUrl(feedbackLink);
        
        return `شكراً ${customerName || 'عزيزنا العميل'} لطلبك من أرض الأغنام! شارك تقييمك: ${shortLink} | Thank you for your order! Share feedback: ${shortLink}`;
    },

    // Generate email with feedback link
    generateEmailMessage(orderId, customerName, customerEmail) {
        const feedbackLink = this.generateFeedbackLink(orderId, customerName, customerEmail);
        
        return {
            to: customerEmail,
            subject: `شارك تجربتك مع أرض الأغنام | Share Your Sheep Land Experience`,
            body: `
السلام عليكم ${customerName || 'عزيزنا العميل'},

شكراً لك لاختيار أرض الأغنام لطلبك رقم ${orderId || ''}. نحن نقدر ثقتك بنا ونود سماع رأيك في تجربتك.

رأيك مهم جداً لنا ويساعدنا في تحسين خدماتنا للعملاء الكرام.

⭐ شارك تقييمك هنا: ${feedbackLink}

---

Dear ${customerName || 'Valued Customer'},

Thank you for choosing Sheep Land for your order ${orderId || ''}. We appreciate your trust and would love to hear about your experience.

Your feedback is very important to us and helps us improve our services.

⭐ Share your feedback here: ${feedbackLink}

With appreciation,
Sheep Land Team
            `
        };
    },

    // Simple URL shortener (basic implementation)
    shortenUrl(url) {
        // In production, use a proper URL shortener service
        // For now, return original URL or create a simple hash
        return url;
    },

    // Show link generator admin panel
    showLinkGenerator() {
        const generator = document.createElement('div');
        generator.className = 'feedback-modal-overlay';
        generator.innerHTML = `
            <div class="feedback-modal link-generator">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2 class="bil-row">
                    <span class="en">Generate Customer Feedback Links</span>
                    <span class="ar">إنشاء روابط تقييم العملاء</span>
                </h2>
                
                <form id="linkGeneratorForm">
                    <div class="form-group">
                        <label class="bil-row">
                            <span class="en">Order ID (optional)</span>
                            <span class="ar">رقم الطلب (اختياري)</span>
                        </label>
                        <input type="text" id="genOrderId" class="feedback-input" placeholder="ORD-123456">
                    </div>

                    <div class="form-group">
                        <label class="bil-row">
                            <span class="en">Customer Name</span>
                            <span class="ar">اسم العميل</span>
                        </label>
                        <input type="text" id="genCustomerName" class="feedback-input" placeholder="Ahmed Hassan">
                    </div>

                    <div class="form-group">
                        <label class="bil-row">
                            <span class="en">Customer Phone (for WhatsApp)</span>
                            <span class="ar">رقم هاتف العميل (للواتساب)</span>
                        </label>
                        <input type="text" id="genCustomerPhone" class="feedback-input" placeholder="201234567890">
                    </div>

                    <div class="form-group">
                        <label class="bil-row">
                            <span class="en">Customer Email (optional)</span>
                            <span class="ar">بريد العميل الإلكتروني (اختياري)</span>
                        </label>
                        <input type="email" id="genCustomerEmail" class="feedback-input" placeholder="customer@email.com">
                    </div>

                    <div class="link-actions">
                        <button type="button" onclick="feedbackSystem.generateAndCopyLink()" class="btn prim">
                            <span class="bil-inline">
                                <span class="en">📋 Copy Direct Link</span>
                                <span class="ar">📋 نسخ الرابط المباشر</span>
                            </span>
                        </button>
                        
                        <button type="button" onclick="feedbackSystem.openWhatsAppMessage()" class="btn success">
                            <span class="bil-inline">
                                <span class="en">💬 Send WhatsApp</span>
                                <span class="ar">💬 إرسال واتساب</span>
                            </span>
                        </button>
                        
                        <button type="button" onclick="feedbackSystem.generateEmailTemplate()" class="btn ghost">
                            <span class="bil-inline">
                                <span class="en">📧 Email Template</span>
                                <span class="ar">📧 قالب بريد إلكتروني</span>
                            </span>
                        </button>
                        
                        <button type="button" onclick="feedbackSystem.generateQRCode()" class="btn ghost">
                            <span class="bil-inline">
                                <span class="en">🔲 QR Code</span>
                                <span class="ar">🔲 رمز الاستجابة</span>
                            </span>
                        </button>
                    </div>
                </form>

                <div id="generatedContent" class="generated-content" style="display:none;">
                    <h3 class="bil-row">
                        <span class="en">Generated Content:</span>
                        <span class="ar">المحتوى المُنشأ:</span>
                    </h3>
                    <textarea id="generatedText" class="feedback-textarea" rows="6" readonly></textarea>
                    <button onclick="feedbackSystem.copyToClipboard()" class="btn ghost sm">
                        <span class="bil-inline">
                            <span class="en">📋 Copy</span>
                            <span class="ar">📋 نسخ</span>
                        </span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(generator);
    },

    // Generate and copy direct feedback link
    generateAndCopyLink() {
        const orderId = document.getElementById('genOrderId').value;
        const customerName = document.getElementById('genCustomerName').value;
        const customerEmail = document.getElementById('genCustomerEmail').value;
        
        const link = this.generateFeedbackLink(orderId, customerName, customerEmail);
        
        navigator.clipboard.writeText(link).then(() => {
            this.showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            this.showGeneratedContent(link);
        });
    },

    // Open WhatsApp with pre-filled message
    openWhatsAppMessage() {
        const orderId = document.getElementById('genOrderId').value;
        const customerName = document.getElementById('genCustomerName').value;
        const customerPhone = document.getElementById('genCustomerPhone').value;
        
        if (!customerPhone) {
            alert('Please enter customer phone number for WhatsApp');
            return;
        }
        
        const whatsappUrl = this.generateWhatsAppMessage(orderId, customerName, customerPhone);
        window.open(whatsappUrl, '_blank');
    },

    // Generate email template
    generateEmailTemplate() {
        const orderId = document.getElementById('genOrderId').value;
        const customerName = document.getElementById('genCustomerName').value;
        const customerEmail = document.getElementById('genCustomerEmail').value;
        
        const emailContent = this.generateEmailMessage(orderId, customerName, customerEmail);
        const template = `To: ${emailContent.to || 'customer@email.com'}
Subject: ${emailContent.subject}

${emailContent.body}`;
        
        this.showGeneratedContent(template);
    },

    // Show generated content in textarea
    showGeneratedContent(content) {
        document.getElementById('generatedContent').style.display = 'block';
        document.getElementById('generatedText').value = content;
    },

    // Copy generated content to clipboard
    copyToClipboard() {
        const textarea = document.getElementById('generatedText');
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            this.showNotification('Content copied to clipboard!', 'success');
        });
    },

    // Generate QR Code for feedback link
    generateQRCode() {
        const orderId = document.getElementById('genOrderId').value;
        const customerName = document.getElementById('genCustomerName').value;
        const customerEmail = document.getElementById('genCustomerEmail').value;
        
        const feedbackLink = this.generateFeedbackLink(orderId, customerName, customerEmail);
        
        // Using QR.js or Google Charts API for QR code generation
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(feedbackLink)}`;
        
        const qrContent = `
            <div class="qr-code-container">
                <img src="${qrUrl}" alt="Feedback QR Code" class="qr-code-image">
                <p class="bil-row">
                    <span class="en">Customer can scan this QR code to give feedback</span>
                    <span class="ar">يمكن للعميل مسح هذا الرمز لإعطاء تقييم</span>
                </p>
                <p class="qr-link">${feedbackLink}</p>
            </div>
        `;
        
        this.showGeneratedContent(qrContent);
        
        // Make the generated content display HTML instead of plain text
        const contentDiv = document.getElementById('generatedContent');
        contentDiv.innerHTML = `
            <h3 class="bil-row">
                <span class="en">Generated QR Code:</span>
                <span class="ar">رمز الاستجابة المُنشأ:</span>
            </h3>
            ${qrContent}
            <button onclick="feedbackSystem.downloadQRCode('${qrUrl}')" class="btn ghost sm">
                <span class="bil-inline">
                    <span class="en">💾 Download QR</span>
                    <span class="ar">💾 تحميل الرمز</span>
                </span>
            </button>
        `;
        contentDiv.style.display = 'block';
    },

    // Download QR code image
    downloadQRCode(qrUrl) {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = 'feedback-qr-code.png';
        link.click();
    },

    // Show testimonial management panel
    showTestimonialManager() {
        const testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
        const pendingFeedback = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]')
            .filter(f => f.rating >= 4 && f.text && f.allow_testimonial);

        const manager = document.createElement('div');
        manager.className = 'feedback-modal-overlay';
        manager.innerHTML = `
            <div class="feedback-modal testimonial-manager">
                <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Testimonial Management</h2>
                
                <div class="testimonial-tabs">
                    <button class="tab-btn active" onclick="feedbackSystem.switchTestimonialTab('approved')">
                        ✅ Published (${testimonials.length})
                    </button>
                    <button class="tab-btn" onclick="feedbackSystem.switchTestimonialTab('pending')">
                        ⏳ Pending Approval (${pendingFeedback.length})
                    </button>
                </div>

                <!-- Published Testimonials -->
                <div id="approvedTestimonials" class="testimonial-tab-content">
                    <h3>Published Testimonials</h3>
                    ${testimonials.length === 0 ? 
                        '<p class="empty-state">No published testimonials yet.</p>' :
                        testimonials.map((t, index) => `
                            <div class="testimonial-item">
                                <div class="testimonial-header">
                                    <span class="rating">${'⭐'.repeat(t.rating)}</span>
                                    <span class="name">${t.name}</span>
                                    <span class="date">${new Date(t.date).toLocaleDateString()}</span>
                                </div>
                                <p class="testimonial-text">"${t.text}"</p>
                                <div class="testimonial-actions">
                                    <button onclick="feedbackSystem.editTestimonial(${index})" class="btn ghost sm">
                                        ✏️ Edit
                                    </button>
                                    <button onclick="feedbackSystem.hideTestimonial(${index})" class="btn ghost sm">
                                        👁️ Hide
                                    </button>
                                    <button onclick="feedbackSystem.deleteTestimonial(${index})" class="btn ghost sm danger">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>

                <!-- Pending Testimonials -->
                <div id="pendingTestimonials" class="testimonial-tab-content" style="display:none;">
                    <h3>Pending Approval</h3>
                    ${pendingFeedback.length === 0 ? 
                        '<p class="empty-state">No feedback pending approval.</p>' :
                        pendingFeedback.map((f, index) => `
                            <div class="testimonial-item pending">
                                <div class="testimonial-header">
                                    <span class="rating">${'⭐'.repeat(f.rating)}</span>
                                    <span class="name">${f.name || 'Anonymous'}</span>
                                    <span class="category">${f.category}</span>
                                </div>
                                <p class="testimonial-text">"${f.text}"</p>
                                <div class="testimonial-actions">
                                    <button onclick="feedbackSystem.approveTestimonial(${index})" class="btn prim sm">
                                        ✅ Approve
                                    </button>
                                    <button onclick="feedbackSystem.rejectTestimonial(${index})" class="btn ghost sm">
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        document.body.appendChild(manager);
    },

    // Switch testimonial tab
    switchTestimonialTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Show/hide tab content
        document.getElementById('approvedTestimonials').style.display = tab === 'approved' ? 'block' : 'none';
        document.getElementById('pendingTestimonials').style.display = tab === 'pending' ? 'block' : 'none';
    },

    // Approve testimonial
    approveTestimonial(index) {
        const pendingFeedback = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]')
            .filter(f => f.rating >= 4 && f.text && f.allow_testimonial);
        
        const feedback = pendingFeedback[index];
        if (feedback) {
            this.addTestimonial(feedback);
            this.showNotification('Testimonial approved and published!', 'success');
            // Refresh the manager
            document.querySelector('.testimonial-manager').parentElement.remove();
            this.showTestimonialManager();
        }
    },

    // Reject testimonial
    rejectTestimonial(index) {
        if (confirm('Are you sure you want to reject this testimonial?')) {
            // Mark feedback as rejected (add a flag)
            const feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
            const pendingFeedback = feedbacks.filter(f => f.rating >= 4 && f.text && f.allow_testimonial);
            const feedback = pendingFeedback[index];
            
            if (feedback) {
                // Find and mark the original feedback as rejected
                const originalIndex = feedbacks.findIndex(f => f.created_at === feedback.created_at);
                if (originalIndex !== -1) {
                    feedbacks[originalIndex].testimonial_rejected = true;
                    localStorage.setItem('sheepland_feedbacks', JSON.stringify(feedbacks));
                }
                
                this.showNotification('Testimonial rejected', 'info');
                // Refresh the manager
                document.querySelector('.testimonial-manager').parentElement.remove();
                this.showTestimonialManager();
            }
        }
    },

    // Edit testimonial
    editTestimonial(index) {
        const testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
        const testimonial = testimonials[index];
        
        if (testimonial) {
            const newText = prompt('Edit testimonial text:', testimonial.text);
            if (newText && newText.trim()) {
                testimonials[index].text = newText.trim();
                testimonials[index].edited = true;
                testimonials[index].edited_date = new Date().toISOString();
                localStorage.setItem('sheepland_testimonials', JSON.stringify(testimonials));
                
                this.showNotification('Testimonial updated!', 'success');
                // Refresh display
                this.loadExistingFeedback();
                // Refresh the manager
                document.querySelector('.testimonial-manager').parentElement.remove();
                this.showTestimonialManager();
            }
        }
    },

    // Hide testimonial
    hideTestimonial(index) {
        if (confirm('Hide this testimonial from public display?')) {
            const testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
            testimonials[index].hidden = true;
            localStorage.setItem('sheepland_testimonials', JSON.stringify(testimonials));
            
            this.showNotification('Testimonial hidden', 'info');
            this.loadExistingFeedback(); // Refresh display
            // Refresh the manager
            document.querySelector('.testimonial-manager').parentElement.remove();
            this.showTestimonialManager();
        }
    },

    // Delete testimonial
    deleteTestimonial(index) {
        if (confirm('Permanently delete this testimonial?')) {
            const testimonials = JSON.parse(localStorage.getItem('sheepland_testimonials') || '[]');
            testimonials.splice(index, 1);
            localStorage.setItem('sheepland_testimonials', JSON.stringify(testimonials));
            
            this.showNotification('Testimonial deleted', 'info');
            this.loadExistingFeedback(); // Refresh display
            // Refresh the manager
            document.querySelector('.testimonial-manager').parentElement.remove();
            this.showTestimonialManager();
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    feedbackSystem.init();
});

// Additional admin functions
feedbackSystem.showFeedbackManager = async function() {
    let feedbacks = [];
    
    try {
        // Try to load from PocketBase first
        if (window.pb && window.pb.authStore.isValid) {
            const records = await window.pb.collection('customer_feedback').getList(1, 100, {
                sort: '-created'
            });
            feedbacks = records.items;
        } else {
            // Fallback to localStorage
            feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
    }
    
    const sortedFeedbacks = feedbacks;

    const manager = document.createElement('div');
    manager.className = 'feedback-modal-overlay';
    manager.innerHTML = `
        <div class="feedback-modal feedback-manager">
            <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <h2>Feedback Management</h2>
            
            <div class="feedback-filters">
                <select id="ratingFilter" onchange="feedbackSystem.filterFeedback()">
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                    <option value="4">4 Stars ⭐⭐⭐⭐</option>
                    <option value="3">3 Stars ⭐⭐⭐</option>
                    <option value="2">2 Stars ⭐⭐</option>
                    <option value="1">1 Star ⭐</option>
                </select>
                
                <select id="categoryFilter" onchange="feedbackSystem.filterFeedback()">
                    <option value="">All Categories</option>
                    <option value="product">Product Quality</option>
                    <option value="delivery">Delivery</option>
                    <option value="service">Customer Service</option>
                    <option value="website">Website</option>
                    <option value="price">Pricing</option>
                    <option value="other">Other</option>
                </select>
                
                <div class="feedback-search">
                    <input type="text" id="feedbackSearch" placeholder="Search feedback..." onkeyup="feedbackSystem.filterFeedback()">
                </div>
            </div>

            <div class="feedback-stats-summary">
                <span>Total: ${feedbacks.length}</span>
                <span>Avg Rating: ${feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : 'N/A'}</span>
                <span>This Month: ${feedbacks.filter(f => new Date(f.created_at).getMonth() === new Date().getMonth()).length}</span>
            </div>

            <div id="feedbackList" class="feedback-list">
                ${sortedFeedbacks.length === 0 ? 
                    '<p class="empty-state">No feedback yet.</p>' :
                    sortedFeedbacks.map((f, index) => `
                        <div class="feedback-item-admin" data-rating="${f.rating}" data-category="${f.category}">
                            <div class="feedback-header-admin">
                                <div class="feedback-info">
                                    <span class="rating">${'⭐'.repeat(f.rating)}</span>
                                    <span class="category">${f.category}</span>
                                    <span class="date">${new Date(f.created_at).toLocaleDateString()}</span>
                                    ${f.order_id ? `<span class="order-id">Order: ${f.order_id}</span>` : ''}
                                </div>
                                <div class="feedback-actions-admin">
                                    ${f.rating <= 3 ? `<button onclick="feedbackSystem.respondToFeedback(${index})" class="btn prim sm">📧 Respond</button>` : ''}
                                    <button onclick="feedbackSystem.deleteFeedback(${index})" class="btn ghost sm danger">🗑️ Delete</button>
                                </div>
                            </div>
                            <div class="feedback-content-admin">
                                <p class="customer-info">
                                    <strong>${f.name || 'Anonymous'}</strong>
                                    ${f.email ? `(${f.email})` : ''}
                                    ${f.phone ? ` • ${f.phone}` : ''}
                                </p>
                                ${f.text ? `<p class="feedback-text">"${f.text}"</p>` : '<p class="no-comment">No comment provided</p>'}
                                ${f.testimonial_rejected ? '<span class="rejected-badge">Testimonial Rejected</span>' : ''}
                                ${f.rating >= 4 && f.allow_testimonial && !f.testimonial_rejected ? '<span class="testimonial-badge">Available for Testimonial</span>' : ''}
                            </div>
                        </div>
                    `).join('')
                }
            </div>

            <div class="bulk-actions">
                <button onclick="feedbackSystem.exportFilteredFeedback()" class="btn ghost">
                    💾 Export Filtered
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(manager);
};

feedbackSystem.showSettingsPanel = function() {
    const settings = JSON.parse(localStorage.getItem('feedback_settings') || '{}');
    
    const panel = document.createElement('div');
    panel.className = 'feedback-modal-overlay';
    panel.innerHTML = `
        <div class="feedback-modal settings-panel">
            <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <h2>Feedback System Settings</h2>
            
            <form id="settingsForm">
                <div class="settings-section">
                    <h3>Display Settings</h3>
                    <label class="setting-item">
                        <input type="checkbox" id="autoPublishTestimonials" ${settings.autoPublishTestimonials ? 'checked' : ''}>
                        Auto-publish 5-star testimonials
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="showFeedbackWidget" ${settings.showFeedbackWidget !== false ? 'checked' : ''}>
                        Show feedback widget on website
                    </label>
                </div>

                <div class="settings-section">
                    <h3>Notification Settings</h3>
                    <label class="setting-item">
                        <span>Admin Email:</span>
                        <input type="email" id="notificationEmail" value="${settings.notificationEmail || ''}" placeholder="admin@yoursite.com">
                    </label>
                </div>

                <div class="settings-section">
                    <h3>Auto-Response Settings</h3>
                    <label class="setting-item">
                        <span>Thank you message:</span>
                        <textarea id="autoResponseTemplate" rows="3">${settings.autoResponseTemplate || 'Thank you for your feedback! We appreciate you taking the time to share your experience with us.'}</textarea>
                    </label>
                </div>

                <button type="button" onclick="feedbackSystem.saveSettings()" class="btn prim">
                    💾 Save Settings
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(panel);
};

feedbackSystem.filterFeedback = function() {
    const rating = document.getElementById('ratingFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('feedbackSearch').value.toLowerCase();
    
    const items = document.querySelectorAll('.feedback-item-admin');
    items.forEach(item => {
        const itemRating = item.dataset.rating;
        const itemCategory = item.dataset.category;
        const itemText = item.textContent.toLowerCase();
        
        const matchesRating = !rating || itemRating === rating;
        const matchesCategory = !category || itemCategory === category;
        const matchesSearch = !search || itemText.includes(search);
        
        item.style.display = matchesRating && matchesCategory && matchesSearch ? 'block' : 'none';
    });
};

feedbackSystem.saveSettings = function() {
    const settings = {
        autoPublishTestimonials: document.getElementById('autoPublishTestimonials').checked,
        showFeedbackWidget: document.getElementById('showFeedbackWidget').checked,
        notificationEmail: document.getElementById('notificationEmail').value,
        autoResponseTemplate: document.getElementById('autoResponseTemplate').value,
        lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('feedback_settings', JSON.stringify(settings));
    feedbackSystem.showNotification('Settings saved successfully!', 'success');
    
    // Apply immediate changes
    if (!settings.showFeedbackWidget) {
        document.querySelector('.feedback-widget')?.style.setProperty('display', 'none');
    } else {
        document.querySelector('.feedback-widget')?.style.removeProperty('display');
    }
    
    // Close settings panel
    document.querySelector('.settings-panel').parentElement.remove();
};

// Export filtered feedback
feedbackSystem.exportFilteredFeedback = function() {
    const feedbacks = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
    
    // Convert to CSV
    const headers = ['Date', 'Rating', 'Category', 'Name', 'Email', 'Phone', 'Feedback Text', 'Order ID', 'Testimonial Allowed'];
    const csvContent = [
        headers.join(','),
        ...feedbacks.map(f => [
            new Date(f.created_at).toLocaleString(),
            f.rating,
            f.category,
            `"${(f.name || 'Anonymous').replace(/"/g, '""')}"`,
            `"${(f.email || '').replace(/"/g, '""')}"`,
            `"${(f.phone || '').replace(/"/g, '""')}"`,
            `"${(f.text || '').replace(/"/g, '""')}"`,
            f.order_id || '',
            f.allow_testimonial ? 'Yes' : 'No'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    this.showNotification('Feedback exported to CSV!', 'success');
};

// Export for use in Alpine components
window.feedbackSystem = feedbackSystem;