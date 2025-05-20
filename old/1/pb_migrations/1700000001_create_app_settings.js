migrate((db) => {
  const collection = new Collection({
    "id": "_pb_app_settings_id_", // Will be auto-generated
    "name": "app_settings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false, "id": "as_setting_key", "name": "setting_key", "type": "text", "required": true, "unique": true,
        "options": { "min": 2, "max": 100 }
      },
      {
        "system": false, "id": "as_value_json", "name": "value_json", "type": "json", "required": true, "options": {}
      },
      {
        "system": false, "id": "as_description", "name": "description", "type": "text", "required": false, "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_app_setting_key` ON `app_settings` (`setting_key`)"
    ],
    "listRule": "@everyone",
    "viewRule": "@everyone",
    "createRule": "@admin",
    "updateRule": "@admin",
    "deleteRule": "@admin"
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("app_settings");
  return dao.deleteCollection(collection);
})