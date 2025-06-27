/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Create feasibility_analyses collection
  const feasibilityCollection = new Collection({
    "id": "feasibility_analyses",
    "name": "feasibility_analyses",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "user",
        "name": "user",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["email"]
        }
      },
      {
        "id": "title",
        "name": "title",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "id": "sheep_count",
        "name": "sheep_count",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": null
        }
      },
      {
        "id": "sheep_price",
        "name": "sheep_price",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "land_cost",
        "name": "land_cost",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "equipment_cost",
        "name": "equipment_cost",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "feed_cost",
        "name": "feed_cost",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "vet_cost",
        "name": "vet_cost",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "labor_cost",
        "name": "labor_cost",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "other_cost",
        "name": "other_cost",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "breeding_rate",
        "name": "breeding_rate",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": 200
        }
      },
      {
        "id": "lamb_price",
        "name": "lamb_price",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "wool_revenue",
        "name": "wool_revenue",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "analysis_period",
        "name": "analysis_period",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 10
        }
      },
      {
        "id": "results",
        "name": "results",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "viewRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "deleteRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "options": {}
  });

  // Create farm_sheep collection
  const sheepCollection = new Collection({
    "id": "farm_sheep",
    "name": "farm_sheep",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "user",
        "name": "user",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["email"]
        }
      },
      {
        "id": "tag_id",
        "name": "tag_id",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "id": "breed",
        "name": "breed",
        "type": "select",
        "required": true,
        "unique": false,
        "options": {
          "values": ["Barki", "Rahmani", "Ossimi", "Saidi", "Other"],
          "maxSelect": 1
        }
      },
      {
        "id": "age_months",
        "name": "age_months",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "weight_kg",
        "name": "weight_kg",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "status",
        "name": "status",
        "type": "select",
        "required": true,
        "unique": false,
        "options": {
          "values": ["healthy", "sick", "pregnant", "nursing"],
          "maxSelect": 1
        }
      },
      {
        "id": "last_vaccination",
        "name": "last_vaccination",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "id": "notes",
        "name": "notes",
        "type": "editor",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "id": "health_records",
        "name": "health_records",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX idx_farm_sheep_user ON farm_sheep (user)",
      "CREATE INDEX idx_farm_sheep_status ON farm_sheep (status)"
    ],
    "listRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "viewRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "deleteRule": "@request.auth.id = user.id || @request.auth.is_admin = true",
    "options": {}
  });

  return Dao(db).saveCollection(feasibilityCollection) && Dao(db).saveCollection(sheepCollection);
}, (db) => {
  // Rollback
  const dao = new Dao(db);
  const feasibilityCollection = dao.findCollectionByNameOrId("feasibility_analyses");
  const sheepCollection = dao.findCollectionByNameOrId("farm_sheep");
  
  return dao.deleteCollection(feasibilityCollection) && dao.deleteCollection(sheepCollection);
});