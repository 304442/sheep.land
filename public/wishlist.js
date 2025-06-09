// Wishlist functionality for Sheep.land
const wishlist = {
    // Initialize wishlist from localStorage
    items: JSON.parse(localStorage.getItem('sheepland_wishlist') || '[]'),
    
    // Add item to wishlist
    add(product) {
        // Check if item already exists
        const exists = this.items.find(item => item.item_key === product.item_key);
        if (!exists) {
            this.items.push({
                item_key: product.item_key,
                name_en: product.nameEN,
                name_ar: product.nameAR,
                price: product.priceDisp,
                image: product.image,
                category: product.cat,
                added_date: new Date().toISOString()
            });
            this.save();
            return true;
        }
        return false;
    },
    
    // Remove item from wishlist
    remove(itemKey) {
        this.items = this.items.filter(item => item.item_key !== itemKey);
        this.save();
    },
    
    // Check if item is in wishlist
    contains(itemKey) {
        return this.items.some(item => item.item_key === itemKey);
    },
    
    // Save to localStorage
    save() {
        localStorage.setItem('sheepland_wishlist', JSON.stringify(this.items));
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
            detail: { count: this.items.length } 
        }));
    },
    
    // Get wishlist count
    getCount() {
        return this.items.length;
    },
    
    // Clear wishlist
    clear() {
        this.items = [];
        this.save();
    },
    
    // Get all items
    getItems() {
        return this.items;
    }
};

// Alpine.js wishlist component
document.addEventListener('alpine:init', () => {
    Alpine.data('wishlistFeature', () => ({
        wishlistItems: wishlist.getItems(),
        wishlistCount: wishlist.getCount(),
        isWishlistOpen: false,
        
        init() {
            // Listen for wishlist updates
            window.addEventListener('wishlistUpdated', (e) => {
                this.wishlistItems = wishlist.getItems();
                this.wishlistCount = e.detail.count;
            });
        },
        
        toggleWishlist(product) {
            if (wishlist.contains(product.item_key)) {
                wishlist.remove(product.item_key);
                this.showNotification('Removed from wishlist', 'remove');
            } else {
                const added = wishlist.add(product);
                if (added) {
                    this.showNotification('Added to wishlist', 'success');
                }
            }
            this.wishlistItems = wishlist.getItems();
        },
        
        isInWishlist(itemKey) {
            return wishlist.contains(itemKey);
        },
        
        removeFromWishlist(itemKey) {
            wishlist.remove(itemKey);
            this.wishlistItems = wishlist.getItems();
            this.showNotification('Removed from wishlist', 'remove');
        },
        
        clearWishlist() {
            if (confirm('Are you sure you want to clear your wishlist?')) {
                wishlist.clear();
                this.wishlistItems = [];
                this.isWishlistOpen = false;
                this.showNotification('Wishlist cleared', 'info');
            }
        },
        
        moveToCart(item) {
            // Get the parent Alpine component (main app)
            const app = this.$parent || Alpine.$data.sheepLand;
            
            // Find the actual product data
            let product = null;
            const categories = ['udheya', 'livesheep_general', 'meat_cuts', 'gathering_package'];
            
            for (const cat of categories) {
                if (app.prodOpts[cat]) {
                    for (const productType of app.prodOpts[cat]) {
                        const found = productType.wps.find(p => p.itemKey === item.item_key);
                        if (found) {
                            product = found;
                            break;
                        }
                    }
                }
                if (product) break;
            }
            
            if (product) {
                // Use the main app's addItemToCart function
                app.addItemToCart(product);
                
                // Remove from wishlist
                wishlist.remove(item.item_key);
                this.wishlistItems = wishlist.getItems();
                
                this.showNotification('Moved to cart', 'success');
            } else {
                this.showNotification('Product not found', 'remove');
            }
        },
        
        showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `wishlist-notification ${type}`;
            notification.innerHTML = `
                <span>${message}</span>
                <span class="close">&times;</span>
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
            
            // Close on click
            notification.querySelector('.close').addEventListener('click', () => {
                notification.remove();
            });
        }
    }));
});