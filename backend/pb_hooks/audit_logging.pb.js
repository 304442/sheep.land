// Audit logging for sensitive operations

// Helper function to log audit
function logAudit(action, entityType, entityId, oldData, newData, userId) {
    try {
        const auditCollection = $app.dao().findCollectionByNameOrId("audit_logs");
        const record = new Record(auditCollection);
        
        record.set("action", action);
        record.set("entity_type", entityType);
        record.set("entity_id", entityId || "");
        record.set("old_data", oldData || {});
        record.set("new_data", newData || {});
        record.set("user_id", userId || "");
        
        $app.dao().saveRecord(record);
    } catch (e) {
        console.error("Audit logging failed:", e);
    }
}

// Log order status changes
onRecordAfterUpdateRequest((e) => {
    if (e.collection.name !== "orders") {
        e.next();
        return;
    }
    
    const oldStatus = e.record.originalCopy().get("status");
    const newStatus = e.record.get("status");
    
    if (oldStatus !== newStatus) {
        logAudit(
            "order_status_change",
            "orders",
            e.record.id,
            { status: oldStatus },
            { status: newStatus },
            e.httpContext.get("authRecord")?.id
        );
    }
    
    e.next();
}, "orders");

// Log admin actions on products
onRecordAfterCreateRequest((e) => {
    const authRecord = e.httpContext.get("authRecord");
    if (e.collection.name !== "products" || !authRecord?.get("is_admin")) {
        e.next();
        return;
    }
    
    logAudit(
        "product_created",
        "products",
        e.record.id,
        null,
        e.record.publicExport(),
        authRecord.id
    );
    
    e.next();
}, "products");

onRecordAfterUpdateRequest((e) => {
    const authRecord = e.httpContext.get("authRecord");
    if (e.collection.name !== "products" || !authRecord?.get("is_admin")) {
        e.next();
        return;
    }
    
    logAudit(
        "product_updated",
        "products",
        e.record.id,
        e.record.originalCopy().publicExport(),
        e.record.publicExport(),
        authRecord.id
    );
    
    e.next();
}, "products");

onRecordAfterDeleteRequest((e) => {
    const authRecord = e.httpContext.get("authRecord");
    if (e.collection.name !== "products" || !authRecord?.get("is_admin")) {
        e.next();
        return;
    }
    
    logAudit(
        "product_deleted",
        "products",
        e.record.id,
        e.record.publicExport(),
        null,
        authRecord.id
    );
    
    e.next();
}, "products");

// Log financial transactions
onRecordAfterCreateRequest((e) => {
    if (e.collection.name !== "financial_transactions") {
        e.next();
        return;
    }
    
    const authRecord = e.httpContext.get("authRecord");
    logAudit(
        "financial_transaction_created",
        "financial_transactions",
        e.record.id,
        null,
        {
            type: e.record.get("transaction_type"),
            amount: e.record.get("amount"),
            category: e.record.get("category")
        },
        authRecord?.id
    );
    
    e.next();
}, "financial_transactions");