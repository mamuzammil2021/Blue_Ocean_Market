CREATE TABLE bom.excavator_cost_operations (
  business_unit_id BIGINT NOT NULL REFERENCES bom.business_units(id),
  user_id BIGINT NOT NULL REFERENCES bom.users(id),
  route TEXT NOT NULL,
  operation_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  PRIMARY KEY (business_unit_id, user_id, route, operation_key)
);
