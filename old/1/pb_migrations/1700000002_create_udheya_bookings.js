migrate((db) => {
  const collection = new Collection({
    "id": "_pb_udheya_bookings_id_", // Will be auto-generated
    "name": "udheya_bookings",
    "type": "base",
    "system": false,
    "schema": [
      { "system": false, "id": "ub_booking_id_text", "name": "booking_id_text", "type": "text", "required": true, "unique": true, "options": {} },
      { "system": false, "id": "ub_sel_lvstk_type_key", "name": "selected_livestock_type_key", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_animal_type", "name": "animal_type", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_animal_weight_sel", "name": "animal_weight_selected", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_animal_base_price", "name": "animal_base_price_egp_at_booking", "type": "number", "required": true, "options": {} },
      { "system": false, "id": "ub_prep_style_val", "name": "prep_style_value", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_custom_prep_details", "name": "custom_prep_details", "type": "text", "required": false, "options": {"max": 1000} },
      { "system": false, "id": "ub_pkg_pref_val", "name": "packaging_preference_value", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_pkg_addon_price", "name": "packaging_addon_price_egp_at_booking", "type": "number", "required": false, "options": {} },
      { "system": false, "id": "ub_sacrifice_day", "name": "sacrifice_day", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_time_slot", "name": "time_slot", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_customer_email", "name": "customer_email", "type": "email", "required": false, "options": {} },
      { "system": false, "id": "ub_delivery_name", "name": "delivery_name", "type": "text", "required": false, "options": {} },
      { "system": false, "id": "ub_delivery_phone", "name": "delivery_phone", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_delivery_city", "name": "delivery_city", "type": "text", "required": false, "options": {} },
      { "system": false, "id": "ub_delivery_address", "name": "delivery_address", "type": "text", "required": false, "options": {"max": 500} },
      { "system": false, "id": "ub_delivery_instr", "name": "delivery_instructions", "type": "text", "required": false, "options": {"max": 500} },
      { "system": false, "id": "ub_dist_choice", "name": "distribution_choice", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_split_details", "name": "split_details", "type": "text", "required": false, "options": {} },
      { "system": false, "id": "ub_niyyah_names", "name": "niyyah_names", "type": "text", "required": false, "options": {} },
      { "system": false, "id": "ub_group_purchase", "name": "group_purchase", "type": "bool", "required": false, "options": {} },
      { "system": false, "id": "ub_payment_method", "name": "payment_method", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_total_price_egp", "name": "total_price_egp", "type": "number", "required": true, "options": {} },
      { "system": false, "id": "ub_currency_used", "name": "currency_used", "type": "text", "required": true, "options": {} },
      { "system": false, "id": "ub_price_in_sel_curr", "name": "price_in_selected_currency", "type": "number", "required": true, "options": {} },
      {
        "system": false, "id": "ub_status", "name": "status", "type": "select", "required": true,
        "options": { "maxSelect": 1, "values": ["Pending Confirmation", "Confirmed", "Processing", "Slaughtered", "Prepared", "Out for Delivery", "Delivered", "Completed", "Cancelled"], "defaultValue": "Pending Confirmation" }
      },
      {
        "system": false, "id": "ub_user_rel", "name": "user", "type": "relation", "required": false,
        "options": { "collectionId": "_pb_users_auth_", "cascadeDelete": false, "minSelect": null, "maxSelect": 1, "displayFields": ["email"] }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_udheya_booking_id_text` ON `udheya_bookings` (`booking_id_text`)"
    ],
    "listRule": "@everyone",
    "viewRule": "@everyone",
    "createRule": "@everyone",
    "updateRule": "@admin",
    "deleteRule": "@admin"
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("udheya_bookings");
  return dao.deleteCollection(collection);
})