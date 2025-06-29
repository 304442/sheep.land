// Customer Relationship Management System
// Complete CRM for sheep farming business

class SheepFarmCRM {
    constructor() {
        this.customers = this.loadCustomers();
        this.segments = this.defineSegments();
        this.campaigns = [];
        this.communications = [];
    }
    
    // Load customers from store database
    loadCustomers() {
        // In production, this would sync with PocketBase
        return JSON.parse(localStorage.getItem('sfm_customers') || '[]');
    }
    
    // Define customer segments
    defineSegments() {
        return {
            vip: {
                name: 'عملاء VIP',
                criteria: {
                    totalSpent: { min: 50000 },
                    orderCount: { min: 10 },
                    avgOrderValue: { min: 3000 }
                },
                benefits: ['خصم 15%', 'أولوية التوصيل', 'مدير حساب خاص']
            },
            
            regular: {
                name: 'عملاء دائمون',
                criteria: {
                    orderCount: { min: 3 },
                    lastOrderDays: { max: 90 }
                },
                benefits: ['خصم 10%', 'عروض حصرية']
            },
            
            eidCustomers: {
                name: 'عملاء الأعياد',
                criteria: {
                    hasUdheyaOrder: true,
                    seasonalOnly: true
                },
                benefits: ['تذكير مبكر', 'حجز مسبق']
            },
            
            b2b: {
                name: 'عملاء الأعمال',
                criteria: {
                    customerType: 'business',
                    avgOrderValue: { min: 10000 }
                },
                benefits: ['أسعار خاصة', 'شروط دفع ميسرة', 'توصيل مجدول']
            },
            
            dormant: {
                name: 'عملاء خاملون',
                criteria: {
                    lastOrderDays: { min: 180 }
                },
                targetAction: 'winback'
            },
            
            newCustomers: {
                name: 'عملاء جدد',
                criteria: {
                    orderCount: { max: 1 },
                    accountAgeDays: { max: 30 }
                },
                targetAction: 'onboarding'
            }
        };
    }
    
    // Create comprehensive customer profile
    createCustomerProfile(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return null;
        
        const orders = this.getCustomerOrders(customerId);
        const communications = this.getCustomerCommunications(customerId);
        
        return {
            // Basic Information
            personal: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                altPhone: customer.altPhone,
                email: customer.email,
                address: customer.address,
                area: customer.area,
                landmark: customer.landmark,
                preferredLanguage: customer.language || 'ar',
                createdAt: customer.createdAt
            },
            
            // Purchase Analytics
            purchasing: {
                firstPurchase: orders[0]?.date,
                lastPurchase: orders[orders.length - 1]?.date,
                totalOrders: orders.length,
                totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
                averageOrderValue: orders.length ? 
                    orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
                orderFrequency: this.calculateOrderFrequency(orders),
                favoriteProducts: this.getFavoriteProducts(orders),
                purchasePattern: this.analyzePurchasePattern(orders)
            },
            
            // Preferences
            preferences: {
                deliveryTime: this.getPreferredDeliveryTime(orders),
                paymentMethod: this.getPreferredPaymentMethod(orders),
                communicationChannel: customer.preferredChannel || 'whatsapp',
                productPreferences: {
                    meatCuts: this.getPreferredCuts(orders),
                    averageWeight: this.getAverageOrderWeight(orders),
                    packaging: customer.packagingPreference
                }
            },
            
            // Engagement
            engagement: {
                lastContact: communications[communications.length - 1]?.date,
                totalInteractions: communications.length,
                responseRate: this.calculateResponseRate(communications),
                satisfactionScore: this.calculateSatisfactionScore(customerId),
                referrals: this.getCustomerReferrals(customerId),
                reviews: this.getCustomerReviews(customerId)
            },
            
            // Segmentation
            segments: this.getCustomerSegments(customer, orders),
            tags: this.generateCustomerTags(customer, orders),
            
            // Predictive Analytics
            predictions: {
                churnRisk: this.predictChurnRisk(customer, orders),
                lifetimeValue: this.predictLifetimeValue(customer, orders),
                nextPurchaseDate: this.predictNextPurchase(orders),
                recommendedProducts: this.recommendProducts(orders),
                upsellOpportunities: this.identifyUpsellOpportunities(orders)
            },
            
            // Marketing
            marketing: {
                emailOptIn: customer.emailOptIn || false,
                smsOptIn: customer.smsOptIn || true,
                whatsappOptIn: customer.whatsappOptIn || true,
                campaignsReceived: this.getCustomerCampaigns(customerId),
                lastCampaignResponse: this.getLastCampaignResponse(customerId)
            }
        };
    }
    
    // Customer communication management
    recordCommunication(customerId, communication) {
        const comm = {
            id: generateUUID(),
            customerId,
            date: new Date().toISOString(),
            type: communication.type, // 'call', 'sms', 'whatsapp', 'email'
            direction: communication.direction, // 'inbound', 'outbound'
            subject: communication.subject,
            content: communication.content,
            sentiment: this.analyzeSentiment(communication.content),
            outcome: communication.outcome,
            followUpRequired: communication.followUpRequired,
            followUpDate: communication.followUpDate,
            agentId: communication.agentId || 'system'
        };
        
        this.communications.push(comm);
        this.updateCustomerEngagement(customerId, comm);
        
        return comm;
    }
    
    // Automated campaign management
    createCampaign(campaignData) {
        const campaign = {
            id: generateUUID(),
            name: campaignData.name,
            type: campaignData.type, // 'promotional', 'winback', 'seasonal', 'educational'
            targetSegments: campaignData.segments,
            
            content: {
                sms: campaignData.smsContent,
                whatsapp: campaignData.whatsappContent,
                email: campaignData.emailContent
            },
            
            offer: campaignData.offer,
            
            schedule: {
                startDate: campaignData.startDate,
                endDate: campaignData.endDate,
                sendTime: campaignData.sendTime,
                timezone: 'Africa/Cairo'
            },
            
            metrics: {
                targeted: 0,
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                converted: 0,
                revenue: 0
            },
            
            status: 'draft'
        };
        
        this.campaigns.push(campaign);
        return campaign;
    }
    
    // Execute campaign
    async executeCampaign(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;
        
        // Get target customers
        const targetCustomers = this.getSegmentCustomers(campaign.targetSegments);
        campaign.metrics.targeted = targetCustomers.length;
        
        for (const customer of targetCustomers) {
            // Check opt-in preferences
            if (!this.canContactCustomer(customer, campaign)) continue;
            
            // Send message based on preferred channel
            const channel = customer.preferredChannel || 'whatsapp';
            const message = this.personalizeMessage(campaign.content[channel], customer);
            
            try {
                await this.sendMessage(customer, channel, message);
                campaign.metrics.sent++;
                
                // Track campaign send
                this.trackCampaignSend(campaign.id, customer.id, channel);
                
            } catch (error) {
                console.error(`Failed to send to ${customer.id}:`, error);
            }
        }
        
        campaign.status = 'sent';
        this.saveCampaigns();
    }
    
    // WhatsApp integration
    async sendWhatsAppMessage(customer, message) {
        // Integration with WhatsApp Business API
        const whatsappAPI = {
            endpoint: 'https://api.whatsapp.com/send',
            businessNumber: '+201234567890'
        };
        
        const personalizedMessage = message
            .replace('{name}', customer.name)
            .replace('{lastProduct}', this.getLastPurchasedProduct(customer.id))
            .replace('{points}', this.getCustomerPoints(customer.id));
        
        // In production, this would use actual WhatsApp Business API
        
        return {
            success: true,
            messageId: generateUUID(),
            timestamp: new Date().toISOString()
        };
    }
    
    // Customer service ticketing
    createServiceTicket(customerId, issue) {
        const ticket = {
            id: generateUUID(),
            customerId,
            createdAt: new Date().toISOString(),
            
            issue: {
                type: issue.type, // 'quality', 'delivery', 'billing', 'other'
                description: issue.description,
                orderId: issue.orderId,
                priority: this.calculateTicketPriority(customerId, issue),
                photos: issue.photos || []
            },
            
            status: 'open',
            assignedTo: this.autoAssignAgent(issue.type),
            
            resolution: {
                steps: [],
                outcome: null,
                compensation: null,
                closedAt: null
            },
            
            satisfaction: null
        };
        
        // Auto-acknowledge
        this.sendTicketAcknowledgment(customerId, ticket);
        
        return ticket;
    }
    
    // Loyalty program management
    manageLoyaltyPoints(customerId, transaction) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        if (!customer.loyalty) {
            customer.loyalty = {
                points: 0,
                tier: 'bronze',
                joinDate: new Date().toISOString(),
                history: []
            };
        }
        
        // Calculate points
        const points = Math.floor(transaction.amount / 100); // 1 point per 100 EGP
        const bonusMultiplier = this.getLoyaltyMultiplier(customer);
        const totalPoints = Math.floor(points * bonusMultiplier);
        
        // Add points
        customer.loyalty.points += totalPoints;
        customer.loyalty.history.push({
            date: new Date().toISOString(),
            type: 'earned',
            points: totalPoints,
            description: `طلب #${transaction.orderId}`,
            balance: customer.loyalty.points
        });
        
        // Check tier upgrade
        this.checkTierUpgrade(customer);
        
        // Send notification
        this.notifyPointsEarned(customer, totalPoints);
        
        this.saveCustomers();
    }
    
    // Predictive analytics functions
    predictChurnRisk(customer, orders) {
        if (orders.length === 0) return 0;
        
        let riskScore = 0;
        
        // Days since last order
        const daysSinceLastOrder = Math.floor(
            (new Date() - new Date(orders[orders.length - 1].date)) / (1000*60*60*24)
        );
        
        if (daysSinceLastOrder > 180) riskScore += 40;
        else if (daysSinceLastOrder > 90) riskScore += 20;
        else if (daysSinceLastOrder > 60) riskScore += 10;
        
        // Order frequency decline
        const recentFrequency = this.calculateRecentOrderFrequency(orders);
        const historicalFrequency = this.calculateHistoricalOrderFrequency(orders);
        
        if (recentFrequency < historicalFrequency * 0.5) riskScore += 30;
        else if (recentFrequency < historicalFrequency * 0.75) riskScore += 15;
        
        // Engagement decline
        const recentEngagement = this.getRecentEngagement(customer.id);
        if (recentEngagement.responseRate < 0.2) riskScore += 20;
        
        // Complaints
        const recentComplaints = this.getRecentComplaints(customer.id);
        if (recentComplaints > 0) riskScore += recentComplaints * 10;
        
        return Math.min(riskScore, 100) / 100; // Convert to 0-1 scale
    }
    
    predictLifetimeValue(customer, orders) {
        if (orders.length === 0) return 0;
        
        // Historical data
        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const accountAge = Math.floor(
            (new Date() - new Date(customer.createdAt)) / (1000*60*60*24)
        );
        const avgOrderValue = totalSpent / orders.length;
        const orderFrequency = orders.length / (accountAge / 30); // Orders per month
        
        // Retention probability
        const retentionProb = 1 - this.predictChurnRisk(customer, orders);
        
        // Expected future months
        const expectedMonths = retentionProb * 24; // 2 years if fully retained
        
        // Growth factor
        const growthFactor = this.calculateGrowthTrend(orders);
        
        // CLV calculation
        const monthlyValue = avgOrderValue * orderFrequency * growthFactor;
        const futureValue = monthlyValue * expectedMonths;
        
        return Math.round(totalSpent + futureValue);
    }
    
    predictNextPurchase(orders) {
        if (orders.length < 2) return null;
        
        // Calculate intervals between orders
        const intervals = [];
        for (let i = 1; i < orders.length; i++) {
            const days = Math.floor(
                (new Date(orders[i].date) - new Date(orders[i-1].date)) / (1000*60*60*24)
            );
            intervals.push(days);
        }
        
        // Weight recent intervals more heavily
        const weightedAvg = intervals.reduce((sum, interval, index) => {
            const weight = (index + 1) / intervals.length;
            return sum + (interval * weight);
        }, 0) / intervals.reduce((sum, _, index) => {
            const weight = (index + 1) / intervals.length;
            return sum + weight;
        }, 0);
        
        // Predict next date
        const lastOrderDate = new Date(orders[orders.length - 1].date);
        const predictedDate = new Date(lastOrderDate.getTime() + weightedAvg * 24*60*60*1000);
        
        // Adjust for seasonality
        const seasonalAdjustment = this.getSeasonalAdjustment(predictedDate);
        predictedDate.setDate(predictedDate.getDate() + seasonalAdjustment);
        
        return {
            date: predictedDate,
            confidence: this.calculatePredictionConfidence(intervals),
            daysUntil: Math.floor((predictedDate - new Date()) / (1000*60*60*24))
        };
    }
    
    // Recommendation engine
    recommendProducts(orders) {
        const recommendations = [];
        
        // Analyze purchase history
        const purchasedProducts = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!purchasedProducts[item.productId]) {
                    purchasedProducts[item.productId] = {
                        count: 0,
                        lastPurchased: null,
                        totalQuantity: 0
                    };
                }
                purchasedProducts[item.productId].count++;
                purchasedProducts[item.productId].lastPurchased = order.date;
                purchasedProducts[item.productId].totalQuantity += item.quantity;
            });
        });
        
        // Frequently bought together
        const associations = this.findProductAssociations(orders);
        
        // Seasonal recommendations
        const seasonalProducts = this.getSeasonalRecommendations();
        
        // Compile recommendations
        Object.entries(purchasedProducts).forEach(([productId, data]) => {
            // Repurchase recommendations
            if (this.shouldRecommendRepurchase(productId, data)) {
                recommendations.push({
                    type: 'repurchase',
                    productId,
                    reason: 'حان وقت إعادة الشراء',
                    confidence: 0.8
                });
            }
            
            // Associated products
            const associated = associations[productId];
            if (associated) {
                associated.forEach(assoc => {
                    if (!purchasedProducts[assoc.productId]) {
                        recommendations.push({
                            type: 'crossSell',
                            productId: assoc.productId,
                            reason: 'يشتريه عملاء آخرون مع منتجاتك المفضلة',
                            confidence: assoc.confidence
                        });
                    }
                });
            }
        });
        
        // Add seasonal
        seasonalProducts.forEach(prod => {
            recommendations.push({
                type: 'seasonal',
                productId: prod.id,
                reason: prod.reason,
                confidence: 0.7
            });
        });
        
        // Sort by confidence and limit
        return recommendations
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
    }
    
    // Helper methods
    calculateOrderFrequency(orders) {
        if (orders.length < 2) return 'نادر';
        
        const avgDays = this.getAverageOrderInterval(orders);
        
        if (avgDays <= 7) return 'أسبوعي';
        if (avgDays <= 14) return 'نصف شهري';
        if (avgDays <= 30) return 'شهري';
        if (avgDays <= 90) return 'ربع سنوي';
        return 'موسمي';
    }
    
    getAverageOrderInterval(orders) {
        if (orders.length < 2) return 0;
        
        let totalDays = 0;
        for (let i = 1; i < orders.length; i++) {
            totalDays += Math.floor(
                (new Date(orders[i].date) - new Date(orders[i-1].date)) / (1000*60*60*24)
            );
        }
        
        return totalDays / (orders.length - 1);
    }
    
    getFavoriteProducts(orders) {
        const productCounts = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productCounts[item.productName]) {
                    productCounts[item.productName] = 0;
                }
                productCounts[item.productName]++;
            });
        });
        
        return Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([product]) => product);
    }
    
    getCustomerSegments(customer, orders) {
        const segments = [];
        
        Object.entries(this.segments).forEach(([key, segment]) => {
            if (this.matchesSegmentCriteria(customer, orders, segment.criteria)) {
                segments.push(key);
            }
        });
        
        return segments;
    }
    
    matchesSegmentCriteria(customer, orders, criteria) {
        if (criteria.totalSpent) {
            const total = orders.reduce((sum, o) => sum + o.total, 0);
            if (criteria.totalSpent.min && total < criteria.totalSpent.min) return false;
            if (criteria.totalSpent.max && total > criteria.totalSpent.max) return false;
        }
        
        if (criteria.orderCount) {
            if (criteria.orderCount.min && orders.length < criteria.orderCount.min) return false;
            if (criteria.orderCount.max && orders.length > criteria.orderCount.max) return false;
        }
        
        if (criteria.lastOrderDays) {
            const days = Math.floor(
                (new Date() - new Date(orders[orders.length - 1]?.date || 0)) / (1000*60*60*24)
            );
            if (criteria.lastOrderDays.min && days < criteria.lastOrderDays.min) return false;
            if (criteria.lastOrderDays.max && days > criteria.lastOrderDays.max) return false;
        }
        
        return true;
    }
    
    // Save methods
    saveCustomers() {
        localStorage.setItem('sfm_customers', JSON.stringify(this.customers));
    }
    
    saveCampaigns() {
        localStorage.setItem('sfm_campaigns', JSON.stringify(this.campaigns));
    }
}

// Initialize CRM
const sheepFarmCRM = new SheepFarmCRM();

// Add CRM UI components
function addCRMInterface() {
    // Add CRM section to navigation
    const moreSheet = document.querySelector('#sfmsMoreSheet .sheet-content > div');
    if (moreSheet) {
        const crmButton = document.createElement('button');
        crmButton.className = 'nav-item';
        crmButton.innerHTML = `
            <span class="nav-icon">👥</span>
            <span class="nav-label">العملاء</span>
        `;
        crmButton.onclick = () => {
            showCRMDashboard();
            hideSfmBottomSheet('sfmsMoreSheet');
        };
        moreSheet.appendChild(crmButton);
    }
}

// Show CRM dashboard
function showCRMDashboard() {
    const content = `
        <div class="crm-dashboard">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <span class="card-icon">👥</span> 
                        إدارة علاقات العملاء
                    </h2>
                    <button class="btn btn-primary btn-sm" onclick="showNewCampaign()">
                        حملة جديدة
                    </button>
                </div>
                
                <div class="stats-grid-dynamic">
                    <div class="stat-card">
                        <div class="stat-value">${sheepFarmCRM.customers.length}</div>
                        <div class="stat-label">إجمالي العملاء</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${sheepFarmCRM.customers.filter(c => 
                                sheepFarmCRM.getCustomerSegments(c, []).includes('vip')
                            ).length}
                        </div>
                        <div class="stat-label">عملاء VIP</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${sheepFarmCRM.campaigns.filter(c => 
                                c.status === 'active'
                            ).length}
                        </div>
                        <div class="stat-label">حملات نشطة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">85%</div>
                        <div class="stat-label">معدل الرضا</div>
                    </div>
                </div>
                
                <div class="crm-sections">
                    <button class="btn btn-secondary" onclick="showCustomerList()">
                        قائمة العملاء
                    </button>
                    <button class="btn btn-secondary" onclick="showSegments()">
                        شرائح العملاء
                    </button>
                    <button class="btn btn-secondary" onclick="showCampaigns()">
                        الحملات التسويقية
                    </button>
                    <button class="btn btn-secondary" onclick="showLoyaltyProgram()">
                        برنامج الولاء
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Create a new section for CRM
    const crmSection = document.createElement('div');
    crmSection.className = 'section-page';
    crmSection.id = 'crmManagement';
    crmSection.innerHTML = content;
    
    document.getElementById('sfmsContentArea').appendChild(crmSection);
    showSfmSection('crmManagement');
}

// Initialize CRM on load
document.addEventListener('DOMContentLoaded', function() {
    addCRMInterface();
});