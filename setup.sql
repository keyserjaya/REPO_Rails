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

-- Create a GiST index on the 'name' column of the 'items' table using gist_trgm_ops.
-- This index will speed up similarity searches (e.g., using ILIKE or similarity() function).
DROP INDEX IF EXISTS idx_items_name_gist;
CREATE INDEX idx_items_name_gist ON items USING gist (name gist_trgm_ops);

-- Create an index on the 'manufacturerId' column of the 'items' table.
-- This will speed up queries that involve joining items with manufacturers or filtering by manufacturerId.
DROP INDEX IF EXISTS idx_items_manufacturer_id;
CREATE INDEX idx_items_manufacturer_id ON items(manufacturerId);

-- Create a GiST index on the 'name' column of the 'manufacturers' table.
-- This will speed up similarity searches on manufacturer names.
DROP INDEX IF EXISTS idx_manufacturers_name_gist;
CREATE INDEX idx_manufacturers_name_gist ON manufacturers USING gist (name gist_trgm_ops);

-- Create a GiST index on the 'address' column of the 'manufacturers' table.
-- This will speed up similarity searches on manufacturer addresses.
DROP INDEX IF EXISTS idx_manufacturers_address_gist;
CREATE INDEX idx_manufacturers_address_gist ON manufacturers USING gist (address gist_trgm_ops);

-- Optional: You might want to add some initial sample data for testing.
-- Example:
-- INSERT INTO manufacturers (name, address) VALUES ('Awesome Corp', '123 Innovation Drive');
-- INSERT INTO items (name, manufacturerId) VALUES ('Widget Pro', 1), ('Gadget Basic', 1);
-- For now, we'll keep it focused on schema and index setup.
