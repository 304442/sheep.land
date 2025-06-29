# PocketBase v0.28.4 Hooks and Migrations Fix Summary

## Issues Fixed

1. **Hook Registration Errors**: The original hooks were using an older API syntax that's not compatible with PocketBase v0.28.4
2. **Migration Syntax**: Migration examples needed adjustment for v0.28.4

## Changes Made

### Hooks (/pb_hooks/main.pb.js)

1. **Changed hook registration from wrapper functions to global functions:**
   - Old: `registerHook("orders", "beforeCreate", (e) => {...})`
   - New: `onRecordCreateRequest("orders", (e) => {...})`

2. **Updated hook names:**
   - `beforeCreate` → `onRecordCreateRequest`
   - `afterCreate` → `onRecordAfterCreateSuccess`
   - `beforeUpdate` → `onRecordUpdateRequest`

3. **Fixed mail sending:**
   - Old: `$app.newMailMessage()`
   - New: `new MailerMessage()` and `$mails.send()`

4. **Updated DAO access:**
   - Always use `$app.dao()` instead of trying to access it from event context

### Migrations (/pb_migrations/1751214000_example_init.js)

1. **Fixed class references:**
   - Changed `new PocketBase.Dao(db)` to `new Dao(db)`
   - Changed `new PocketBase.SchemaField` to `new SchemaField`

## PocketBase v0.28.4 Global Functions Available

The following global functions are available in JavaScript hooks:
- `onRecordCreateRequest` - Before record creation
- `onRecordAfterCreateSuccess` - After successful record creation
- `onRecordUpdateRequest` - Before record update
- `onRecordAfterUpdateSuccess` - After successful record update
- `onRecordDeleteRequest` - Before record deletion
- `onRecordAfterDeleteSuccess` - After successful record deletion
- And many more (see logs for full list)

## Testing

The hooks now load successfully without errors. The server starts normally and the hooks are properly registered for the orders collection.

## Next Steps

1. Test order creation to ensure hooks work properly
2. Test order updates (especially cancellation) to verify stock restoration
3. Configure SMTP settings if email sending is needed