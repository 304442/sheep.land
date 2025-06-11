# PocketBase Migrations

This directory is for PocketBase native migrations that work with your Docker deployment.

## How It Works

Your deployment script (`pb-autodeploy.v3.sh`) automatically:
1. Detects migration files in this directory
2. Runs `pocketbase migrate up` command
3. Applies migrations in order (by filename)

## Migration File Format

PocketBase expects migration files like:
```javascript
migrate((db) => {
  // Migration up logic
}, (db) => {
  // Migration down logic (optional)
})
```

## Example Migration

To add a new field to products in the future:

`pb_migrations/1704067200_add_special_discount.js`:
```javascript
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("products");
  
  // Add new field
  collection.schema.addField(new SchemaField({
    "system": false,
    "name": "special_discount",
    "type": "number",
    "required": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": 100
    }
  }));
  
  return dao.saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("products");
  
  // Remove field on rollback
  collection.schema.removeField("special_discount");
  
  return dao.saveCollection(collection);
})
```

## Naming Convention

Use timestamp prefix for proper ordering:
- `1704067200_description.js` (timestamp_description.js)
- Timestamp ensures migrations run in correct order

## Important Notes

1. Migrations run automatically on deployment
2. Each migration runs only once (tracked by PocketBase)
3. Test migrations locally before pushing
4. Your deployment script logs: "🗄️ Found X migration files"
5. Successful migrations show: "✅ Migrations applied"