-- Enable the pg_trgm extension if not already enabled.
-- This extension provides functions and operators for determining the similarity of
-- alphanumeric text based on trigram matching.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the 'manufacturers' table if it doesn't already exist.
CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
);

-- Create the 'items' table if it doesn't already exist.
-- Initially created without manufacturerId to avoid order-of-creation issues
-- if this script is run in parts or if manufacturers table doesn't exist yet.
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Add manufacturerId column to items table if it doesn't exist.
ALTER TABLE items
ADD COLUMN IF NOT EXISTS manufacturerId INTEGER;

-- Add barcode column to items table if it doesn't exist.
ALTER TABLE items
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);

-- Add price column to items table if it doesn't exist.
ALTER TABLE items
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Add quantity column to items table if it doesn't exist.
ALTER TABLE items
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0;

-- Drop existing foreign key constraint if it exists, to avoid error if re-running.
-- This is important for script re-runnability.
ALTER TABLE items
DROP CONSTRAINT IF EXISTS fk_manufacturer;

-- Add foreign key constraint to link items.manufacturerId to manufacturers.id.
-- ON DELETE SET NULL means if a manufacturer is deleted, the corresponding
-- items will have their manufacturerId set to NULL rather than being deleted.
ALTER TABLE items
ADD CONSTRAINT fk_manufacturer
    FOREIGN KEY(manufacturerId)
    REFERENCES manufacturers(id)
    ON DELETE SET NULL;

-- Add UNIQUE constraint to barcode column in items table.
-- Drop existing constraint if it exists, to avoid error if re-running.
ALTER TABLE items
DROP CONSTRAINT IF EXISTS uq_items_barcode;
ALTER TABLE items
ADD CONSTRAINT uq_items_barcode UNIQUE (barcode);

-- Create a GiST index on the 'name' column of the 'items' table using gist_trgm_ops.
-- This index will speed up similarity searches (e.g., using ILIKE or similarity() function).
DROP INDEX IF EXISTS idx_items_name_gist;
CREATE INDEX idx_items_name_gist ON items USING gist (name gist_trgm_ops);

-- Create an index on the 'manufacturerId' column of the 'items' table.
-- This will speed up queries that involve joining items with manufacturers or filtering by manufacturerId.
DROP INDEX IF EXISTS idx_items_manufacturer_id;
CREATE INDEX idx_items_manufacturer_id ON items(manufacturerId);

-- Create an index on the 'barcode' column of the 'items' table.
DROP INDEX IF EXISTS idx_items_barcode;
CREATE INDEX idx_items_barcode ON items(barcode);

-- Create a GiST index on the 'name' column of the 'manufacturers' table.
-- This will speed up similarity searches on manufacturer names.
DROP INDEX IF EXISTS idx_manufacturers_name_gist;
CREATE INDEX idx_manufacturers_name_gist ON manufacturers USING gist (name gist_trgm_ops);

-- Create a GiST index on the 'address' column of the 'manufacturers' table.
-- This will speed up similarity searches on manufacturer addresses.
DROP INDEX IF EXISTS idx_manufacturers_address_gist;
CREATE INDEX idx_manufacturers_address_gist ON manufacturers USING gist (address gist_trgm_ops);

-- Create cashiers table
CREATE TABLE IF NOT EXISTS cashiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- For storing bcrypt hashes
    join_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- address column will be added via ALTER TABLE below
);

-- Alter cashiers table to add address column
ALTER TABLE cashiers
ADD COLUMN IF NOT EXISTS address TEXT;

-- Set address column to NOT NULL
-- Note: If the table already has rows with NULL addresses, this command will fail.
-- For a setup script that might be run on an empty table or where this constraint is newly enforced, it's okay.
-- A more robust approach for existing data would be to first populate NULL addresses or add a DEFAULT.
-- Given this is a setup script, we'll proceed with setting NOT NULL.
ALTER TABLE cashiers
ALTER COLUMN address SET NOT NULL;

-- Create 'transactions' table if it doesn't already exist.
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    overall_total_price DECIMAL(10, 2) NOT NULL
    -- cashier_id will be added via ALTER TABLE below
);

-- Alter transactions table to add cashier_id
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS cashier_id INTEGER;

-- Add foreign key constraint for cashier_id
-- Drop if exists to make script re-runnable (name it e.g., fk_transactions_cashier)
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS fk_transactions_cashier;

ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_cashier
    FOREIGN KEY(cashier_id)
    REFERENCES cashiers(id)
    ON DELETE SET NULL; -- Or ON DELETE RESTRICT, SET NULL is chosen per plan

-- Create 'transaction_items' table if it doesn't already exist.
-- This table links items to transactions and stores sale-specific details.
CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity_sold INTEGER NOT NULL,
    price_per_unit_at_sale DECIMAL(10, 2) NOT NULL,
    line_item_total_price DECIMAL(10, 2) NOT NULL -- This is quantity_sold * price_per_unit_at_sale
);

-- Create indexes for 'transaction_items' table to improve query performance.
DROP INDEX IF EXISTS idx_transaction_items_transaction_id;
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);

DROP INDEX IF EXISTS idx_transaction_items_item_id;
CREATE INDEX idx_transaction_items_item_id ON transaction_items(item_id);

-- Add index on transactions.cashier_id
DROP INDEX IF EXISTS idx_transactions_cashier_id;
CREATE INDEX idx_transactions_cashier_id ON transactions(cashier_id);

-- Optional: You might want to add some initial sample data for testing.
-- Example:
-- INSERT INTO manufacturers (name, address) VALUES ('Awesome Corp', '123 Innovation Drive');
-- INSERT INTO items (name, manufacturerId) VALUES ('Widget Pro', 1), ('Gadget Basic', 1);
-- For now, we'll keep it focused on schema and index setup.
