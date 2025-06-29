// Farm Management API Endpoints and Business Logic

// Helper function to check admin access
function requireAdmin(authRecord) {
    if (!authRecord || !authRecord.get("is_admin")) {
        throw new ForbiddenError("Admin access required");
    }
}

// Farm sheep inventory calculations
onRecordViewRequest((e) => {
    if (e.collection.name !== "farm_sheep") {
        e.next();
        return;
    }
    
    const authRecord = e.httpContext.get("authRecord");
    requireAdmin(authRecord);
    
    // Add calculated fields
    const record = e.record;
    const birthDate = new Date(record.get("birth_date"));
    const today = new Date();
    const ageInMonths = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 30));
    
    // Add age calculation to response
    record.set("age_months", ageInMonths);
    
    // Calculate estimated value based on weight
    const currentWeight = record.get("current_weight") || 0;
    const pricePerKg = 150; // Default market price
    record.set("estimated_value", currentWeight * pricePerKg);
    
    e.next();
}, "farm_sheep");

// Feed inventory monitoring
onRecordCreateRequest((e) => {
    if (e.collection.name !== "feed_inventory") {
        e.next();
        return;
    }
    
    const authRecord = e.httpContext.get("authRecord");
    requireAdmin(authRecord);
    
    const record = e.record;
    const quantity = record.get("quantity_kg") || 0;
    const reorderLevel = record.get("reorder_level") || 100;
    
    // Set low stock alert
    if (quantity <= reorderLevel) {
        record.set("low_stock_alert", true);
    } else {
        record.set("low_stock_alert", false);
    }
    
    // Calculate total value
    const pricePerKg = record.get("price_per_kg") || 0;
    record.set("total_value", quantity * pricePerKg);
    
    e.next();
}, "feed_inventory");

// Health records validation
onRecordCreateRequest((e) => {
    if (e.collection.name !== "health_records") {
        e.next();
        return;
    }
    
    const authRecord = e.httpContext.get("authRecord");
    requireAdmin(authRecord);
    
    const record = e.record;
    const checkupDate = new Date(record.get("checkup_date"));
    
    // Validate checkup date
    if (checkupDate > new Date()) {
        throw new BadRequestError("Checkup date cannot be in the future");
    }
    
    // Auto-set next checkup if treatment prescribed
    const treatment = record.get("treatment");
    if (treatment && !record.get("next_checkup_date")) {
        const nextCheckup = new Date(checkupDate);
        nextCheckup.setDate(nextCheckup.getDate() + 14); // 2 weeks later
        record.set("next_checkup_date", nextCheckup.toISOString());
    }
    
    e.next();
}, "health_records");

// Financial transaction categorization
onRecordCreateRequest((e) => {
    if (e.collection.name !== "financial_transactions") {
        e.next();
        return;
    }
    
    const authRecord = e.httpContext.get("authRecord");
    requireAdmin(authRecord);
    
    const record = e.record;
    const type = record.get("transaction_type");
    const amount = record.get("amount") || 0;
    
    // Validate amount based on type
    if (type === "expense" && amount > 0) {
        record.set("amount", -Math.abs(amount));
    } else if (type === "income" && amount < 0) {
        record.set("amount", Math.abs(amount));
    }
    
    // Set default date if not provided
    if (!record.get("transaction_date")) {
        record.set("transaction_date", new Date().toISOString());
    }
    
    e.next();
}, "financial_transactions");

// Custom API endpoints for farm analytics
routerAdd("GET", "/api/farm/analytics/overview", (c) => {
    const authRecord = c.get("authRecord");
    requireAdmin(authRecord);
    
    try {
        // Get total sheep count
        const sheepCount = $app.dao().findRecordsByFilter(
            "farm_sheep", 
            "status = 'active'", 
            "", 0, 1
        ).totalItems;
        
        // Get total feed inventory value
        const feedRecords = $app.dao().findRecordsByFilter(
            "feed_inventory", 
            "", "", 0, 100
        ).items;
        
        let totalFeedValue = 0;
        let lowStockItems = 0;
        feedRecords.forEach(record => {
            totalFeedValue += record.get("total_value") || 0;
            if (record.get("low_stock_alert")) {
                lowStockItems++;
            }
        });
        
        // Get pending health checkups
        const today = new Date().toISOString().split('T')[0];
        const pendingCheckups = $app.dao().findRecordsByFilter(
            "health_records",
            `next_checkup_date <= '${today}'`,
            "", 0, 1
        ).totalItems;
        
        // Get financial summary for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const financialRecords = $app.dao().findRecordsByFilter(
            "financial_transactions",
            `transaction_date >= '${startOfMonth.toISOString()}'`,
            "", 0, 1000
        ).items;
        
        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        financialRecords.forEach(record => {
            const amount = record.get("amount") || 0;
            if (amount > 0) {
                monthlyIncome += amount;
            } else {
                monthlyExpenses += Math.abs(amount);
            }
        });
        
        return c.json(200, {
            overview: {
                total_sheep: sheepCount,
                feed_inventory_value: totalFeedValue,
                low_stock_alerts: lowStockItems,
                pending_checkups: pendingCheckups,
                monthly_income: monthlyIncome,
                monthly_expenses: monthlyExpenses,
                monthly_profit: monthlyIncome - monthlyExpenses
            },
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        return c.json(500, { error: "Failed to generate analytics" });
    }
});

// Breeding records endpoint
routerAdd("GET", "/api/farm/breeding/records", (c) => {
    const authRecord = c.get("authRecord");
    requireAdmin(authRecord);
    
    try {
        // Get all sheep with parent information
        const sheepRecords = $app.dao().findRecordsByFilter(
            "farm_sheep",
            "",
            "-created", 0, 1000
        ).items;
        
        const breedingRecords = [];
        sheepRecords.forEach(sheep => {
            if (sheep.get("mother_tag") || sheep.get("father_tag")) {
                breedingRecords.push({
                    id: sheep.id,
                    tag_number: sheep.get("tag_number"),
                    birth_date: sheep.get("birth_date"),
                    mother_tag: sheep.get("mother_tag"),
                    father_tag: sheep.get("father_tag"),
                    breed: sheep.get("breed"),
                    gender: sheep.get("gender"),
                    current_weight: sheep.get("current_weight")
                });
            }
        });
        
        return c.json(200, {
            records: breedingRecords,
            total: breedingRecords.length
        });
    } catch (error) {
        return c.json(500, { error: "Failed to fetch breeding records" });
    }
});

// Tasks endpoint (using health records for upcoming tasks)
routerAdd("GET", "/api/farm/tasks", (c) => {
    const authRecord = c.get("authRecord");
    requireAdmin(authRecord);
    
    try {
        // Get upcoming health checkups as tasks
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcomingCheckups = $app.dao().findRecordsByFilter(
            "health_records",
            `next_checkup_date <= '${nextWeek.toISOString()}' AND next_checkup_date >= '${new Date().toISOString()}'`,
            "next_checkup_date", 0, 100
        ).items;
        
        // Get low stock feed items as tasks
        const lowStockFeeds = $app.dao().findRecordsByFilter(
            "feed_inventory",
            "low_stock_alert = true",
            "", 0, 100
        ).items;
        
        const tasks = [];
        
        // Add health checkup tasks
        upcomingCheckups.forEach(checkup => {
            tasks.push({
                id: `health_${checkup.id}`,
                type: "health_checkup",
                title: `Health checkup for sheep ${checkup.get("sheep_id")}`,
                due_date: checkup.get("next_checkup_date"),
                priority: "high",
                status: "pending"
            });
        });
        
        // Add feed reorder tasks
        lowStockFeeds.forEach(feed => {
            tasks.push({
                id: `feed_${feed.id}`,
                type: "feed_reorder",
                title: `Reorder ${feed.get("feed_type")} - Low stock (${feed.get("quantity_kg")}kg remaining)`,
                due_date: new Date().toISOString(),
                priority: "medium",
                status: "pending"
            });
        });
        
        // Sort by due date
        tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        
        return c.json(200, {
            tasks: tasks,
            total: tasks.length
        });
    } catch (error) {
        return c.json(500, { error: "Failed to fetch tasks" });
    }
});

// Export reports endpoint
routerAdd("POST", "/api/farm/reports/export", (c) => {
    const authRecord = c.get("authRecord");
    requireAdmin(authRecord);
    
    const body = $apis.requestInfo(c).data;
    const reportType = body.type || "summary";
    const format = body.format || "json";
    
    try {
        let reportData = {};
        
        switch (reportType) {
            case "inventory":
                const sheep = $app.dao().findRecordsByFilter("farm_sheep", "status = 'active'", "", 0, 1000).items;
                reportData = {
                    title: "Farm Inventory Report",
                    generated: new Date().toISOString(),
                    total_animals: sheep.length,
                    animals: sheep.map(s => ({
                        tag: s.get("tag_number"),
                        breed: s.get("breed"),
                        weight: s.get("current_weight"),
                        age_months: Math.floor((new Date() - new Date(s.get("birth_date"))) / (1000 * 60 * 60 * 24 * 30))
                    }))
                };
                break;
                
            case "financial":
                const transactions = $app.dao().findRecordsByFilter("financial_transactions", "", "-transaction_date", 0, 1000).items;
                let totalIncome = 0;
                let totalExpenses = 0;
                
                transactions.forEach(t => {
                    const amount = t.get("amount") || 0;
                    if (amount > 0) totalIncome += amount;
                    else totalExpenses += Math.abs(amount);
                });
                
                reportData = {
                    title: "Financial Report",
                    generated: new Date().toISOString(),
                    summary: {
                        total_income: totalIncome,
                        total_expenses: totalExpenses,
                        net_profit: totalIncome - totalExpenses
                    },
                    transactions: transactions.map(t => ({
                        date: t.get("transaction_date"),
                        type: t.get("transaction_type"),
                        category: t.get("category"),
                        amount: t.get("amount"),
                        description: t.get("description")
                    }))
                };
                break;
                
            default:
                throw new BadRequestError("Invalid report type");
        }
        
        if (format === "csv") {
            // Simple CSV conversion
            let csv = Object.keys(reportData.animals?.[0] || reportData.transactions?.[0] || {}).join(",") + "\n";
            const items = reportData.animals || reportData.transactions || [];
            items.forEach(item => {
                csv += Object.values(item).join(",") + "\n";
            });
            
            c.response().header().set("Content-Type", "text/csv");
            c.response().header().set("Content-Disposition", `attachment; filename="${reportType}_report.csv"`);
            return c.string(200, csv);
        }
        
        return c.json(200, reportData);
    } catch (error) {
        return c.json(500, { error: "Failed to generate report" });
    }
});