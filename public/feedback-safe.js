// Safe Feedback System with DOM manipulation instead of innerHTML
const safeFeedbackSystem = {
    // Generate cryptographically secure random ID
    generateSecureId(prefix = '') {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        return prefix + hex;
    },

    // Safe DOM creation helper
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('on')) {
                // Event handlers
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },

    // Create feedback modal safely
    createFeedbackModal() {
        const modal = this.createElement('div', {
            id: 'feedbackModal',
            className: 'feedback-modal',
            style: 'display: none;'
        });

        const modalContent = this.createElement('div', { className: 'feedback-modal-content' });
        
        // Header
        const header = this.createElement('div', { className: 'feedback-header' }, [
            this.createElement('h2', { textContent: 'We Value Your Feedback' }),
            this.createElement('button', {
                className: 'feedback-close',
                textContent: '×',
                onclick: () => this.closeFeedbackModal()
            })
        ]);

        // Categories
        const categories = this.createElement('div', { 
            id: 'feedbackCategories',
            className: 'feedback-categories' 
        });

        const categoryButtons = [
            { icon: '⭐', text: 'Rate Experience', value: 'rating' },
            { icon: '💬', text: 'Leave Review', value: 'review' },
            { icon: '🐑', text: 'Product Quality', value: 'quality' },
            { icon: '🚚', text: 'Delivery Service', value: 'delivery' },
            { icon: '💡', text: 'Suggestions', value: 'suggestion' },
            { icon: '⚠️', text: 'Report Issue', value: 'issue' }
        ];

        categoryButtons.forEach(cat => {
            const button = this.createElement('button', {
                className: 'feedback-category',
                onclick: () => this.selectFeedbackCategory(cat.value)
            }, [
                this.createElement('span', { className: 'category-icon', textContent: cat.icon }),
                this.createElement('span', { textContent: cat.text })
            ]);
            categories.appendChild(button);
        });

        // Form container
        const formContainer = this.createElement('div', {
            id: 'feedbackForm',
            style: 'display: none;'
        });

        // Success message
        const successMessage = this.createElement('div', {
            id: 'feedbackSuccess',
            className: 'feedback-success',
            style: 'display: none;'
        }, [
            this.createElement('div', { className: 'success-icon', textContent: '✅' }),
            this.createElement('h3', { textContent: 'Thank You!' }),
            this.createElement('p', { textContent: 'Your feedback has been submitted successfully.' })
        ]);

        modalContent.appendChild(header);
        modalContent.appendChild(categories);
        modalContent.appendChild(formContainer);
        modalContent.appendChild(successMessage);
        modal.appendChild(modalContent);

        return modal;
    },

    // Initialize the system
    init() {
        // Create and append feedback modal
        const modal = this.createFeedbackModal();
        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners();
        this.checkForDirectFeedbackLink();
    },

    // Rest of the methods remain the same but use safe DOM manipulation
    setupEventListeners() {
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('feedbackModal');
            if (e.target === modal) {
                this.closeFeedbackModal();
            }
        });
    },

    openFeedbackModal(trigger = 'manual', orderId = null, customerName = null) {
        const modal = document.getElementById('feedbackModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.classList.add('feedback-modal-open');
        }
    },

    closeFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('feedback-modal-open');
        }
    },

    selectFeedbackCategory(category) {
        const categoriesDiv = document.getElementById('feedbackCategories');
        const formDiv = document.getElementById('feedbackForm');
        
        if (categoriesDiv) categoriesDiv.style.display = 'none';
        if (formDiv) {
            formDiv.style.display = 'block';
            this.buildFeedbackForm(category, formDiv);
        }
    },

    buildFeedbackForm(category, container) {
        // Clear existing content
        container.textContent = '';

        const form = this.createElement('form', {
            onsubmit: (e) => {
                e.preventDefault();
                this.submitFeedback(category, new FormData(e.target));
            }
        });

        // Add form fields based on category
        if (category === 'rating') {
            form.appendChild(this.createRatingField());
        }

        // Common fields
        form.appendChild(this.createElement('div', { className: 'form-group' }, [
            this.createElement('label', { textContent: 'Your Feedback:' }),
            this.createElement('textarea', {
                name: 'feedback',
                required: true,
                placeholder: 'Share your thoughts...',
                rows: 4
            })
        ]));

        // Submit button
        form.appendChild(this.createElement('button', {
            type: 'submit',
            className: 'feedback-submit'
        }, ['Submit Feedback']));

        container.appendChild(form);
    },

    createRatingField() {
        const ratingGroup = this.createElement('div', { className: 'form-group rating-group' }, [
            this.createElement('label', { textContent: 'Rate your experience:' })
        ]);

        const starsContainer = this.createElement('div', { className: 'rating-stars' });
        
        for (let i = 1; i <= 5; i++) {
            const star = this.createElement('span', {
                className: 'star',
                textContent: '⭐',
                onclick: () => this.setRating(i)
            });
            star.dataset.rating = i;
            starsContainer.appendChild(star);
        }

        ratingGroup.appendChild(starsContainer);
        ratingGroup.appendChild(this.createElement('input', {
            type: 'hidden',
            name: 'rating',
            id: 'ratingValue',
            value: '5'
        }));

        return ratingGroup;
    },

    setRating(rating) {
        document.getElementById('ratingValue').value = rating;
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    },

    async submitFeedback(category, formData) {
        const feedbackData = {
            category,
            feedback: formData.get('feedback'),
            rating: formData.get('rating') || null,
            timestamp: new Date().toISOString(),
            id: this.generateSecureId('fb_')
        };

        try {
            // Save to localStorage with try-catch
            const existingFeedback = JSON.parse(localStorage.getItem('sheepland_feedbacks') || '[]');
            existingFeedback.push(feedbackData);
            localStorage.setItem('sheepland_feedbacks', JSON.stringify(existingFeedback));
        } catch (e) {
            console.error('Failed to save feedback locally');
        }

        // Show success message
        document.getElementById('feedbackForm').style.display = 'none';
        document.getElementById('feedbackSuccess').style.display = 'block';

        setTimeout(() => this.closeFeedbackModal(), 2000);
    },

    checkForDirectFeedbackLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const feedbackToken = urlParams.get('feedback');
        
        if (feedbackToken) {
            setTimeout(() => {
                this.openFeedbackModal('direct_link');
            }, 500);
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => safeFeedbackSystem.init());
} else {
    safeFeedbackSystem.init();
}

// Export for use in other modules
window.safeFeedbackSystem = safeFeedbackSystem;