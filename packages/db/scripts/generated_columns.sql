-- TODO: Create these generated columns automatically during sync


ALTER TABLE supaglue.crm_users ADD _name VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'name') STORED;

ALTER TABLE supaglue.crm_users ADD _email VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'email') STORED;

ALTER TABLE supaglue.crm_accounts ADD _name VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'name') STORED;

ALTER TABLE supaglue.crm_accounts ADD _website VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'website') STORED;


ALTER TABLE supaglue.crm_opportunities ADD _name VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'name') STORED;

ALTER TABLE supaglue.crm_opportunities ADD _amount VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'amount') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _owner_id VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'owner_id') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _account_id VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'account_id') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _stage VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'stage') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _close_date VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'close_date') STORED;
  
