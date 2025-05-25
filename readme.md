# Node.js PostgreSQL CRUD Template

## Description
This project provides a simple template for performing CRUD (Create, Read, Update, Delete) operations on a PostgreSQL database using Node.js. It features a connection pool implemented with the `pg` (node-postgres) library for efficient database interactions.

## Prerequisites
Before you begin, ensure you have the following installed:
*   **Node.js and npm:** You can download them from [https://nodejs.org/](https://nodejs.org/).
*   **PostgreSQL Server:** You need a running PostgreSQL server. Download and install it from [https://www.postgresql.org/](https://www.postgresql.org/).

## Setup

### 1. Database Configuration

**a. Create a PostgreSQL Database:**
   Open your PostgreSQL terminal (e.g., `psql`) or use a GUI tool like pgAdmin. Create a new database by running:
   ```sql
   CREATE DATABASE your_database_name;
   ```
   Replace `your_database_name` with your desired database name.

**b. Create the `items` Table:**
   Connect to your newly created database.

**c. Run the Setup Script (`setup.sql`):**
   The `setup.sql` script is provided to initialize your database schema. It performs the following actions:
    *   Enables the `pg_trgm` extension for efficient trigram-based text searching.
    *   Creates the `manufacturers` table:
        ```sql
        CREATE TABLE IF NOT EXISTS manufacturers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT
        );
        ```
    *   Creates the `items` table with a foreign key to `manufacturers`:
        ```sql
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            manufacturerId INTEGER,
            CONSTRAINT fk_manufacturer
                FOREIGN KEY(manufacturerId)
                REFERENCES manufacturers(id)
                ON DELETE SET NULL
        );
        ```
    *   Creates the `items` table with a foreign key to `manufacturers` and new inventory fields:
        ```sql
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            manufacturerId INTEGER,
            barcode VARCHAR(255), -- New
            price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- New
            quantity INTEGER NOT NULL DEFAULT 0, -- New
            CONSTRAINT fk_manufacturer
                FOREIGN KEY(manufacturerId)
                REFERENCES manufacturers(id)
                ON DELETE SET NULL,
            CONSTRAINT uq_items_barcode UNIQUE (barcode) -- New
        );
        ```
    *   Creates GiST indexes for text search:
        *   `idx_items_name_gist` on `items.name`.
        *   `idx_manufacturers_name_gist` on `manufacturers.name`.
        *   `idx_manufacturers_address_gist` on `manufacturers.address`.
    *   Creates standard indexes for faster joins and lookups:
        *   `idx_items_manufacturer_id` on `items.manufacturerId`.
        *   `idx_items_barcode` on `items.barcode`. -- New

   Execute the script using a tool like `psql`:
   ```bash
   psql -U your_username -d your_database_name -f setup.sql
   ```
   Replace `your_username` and `your_database_name` with your actual PostgreSQL username and database name. The script uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` where appropriate, making it re-runnable.

**d. Update Connection Details in `app.js`:**
   Open the `app.js` file in the project. You will find placeholder values for the PostgreSQL connection:
   ```javascript
   const pool = new Pool({
     user: 'your_username', // Placeholder
     host: 'your_host',     // Placeholder
     database: 'your_database', // Placeholder - Replace with your_database_name
     password: 'your_password', // Placeholder
     port: 5432,            // Placeholder - Default PostgreSQL port
   });
   ```
   Modify these placeholders (`your_username`, `your_host`, `your_database`, `your_password`, and `port` if necessary) to match your PostgreSQL server configuration and the database you created.
   **Note:** For production environments, it's highly recommended to use environment variables for sensitive information like database credentials. However, for this template, you'll directly edit these placeholders.

### 2. Install Dependencies

**a. Clone the Repository (or Download Files):**
   If you're using Git, clone the repository:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```
   Otherwise, download the project files (`app.js`, `package.json`) and navigate to the project directory in your terminal.

**b. Install npm Packages:**
   In the project directory, run the following command to install the necessary dependencies (primarily the `pg` module) listed in `package.json`:
   ```bash
   npm install
   ```

## Running the Application
Once the setup is complete, you can run the application. The `demonstrateCRUD` function in `app.js` will showcase various operations, including interactions between items and manufacturers.

Execute the following command in your terminal from the project root directory:
```bash
node app.js
```

**Expected Output:**
The script will run the `demonstrateCRUD` function. The output will showcase creation of items (including new fields like barcode, price, quantity), manufacturers, linking them, updating item details, searching (by name and barcode), and finally, cleaning up. Key parts of the output will resemble:
```
Attempting to create an item with full details...
Created Item (Deluxe Widget): {
  id: 1,
  name: 'Deluxe Widget',
  manufacturerid: null,
  barcode: 'DW123456789',
  price: '199.99',
  quantity: 50
}
Attempting to create a second item with minimal details...
Created Item (Basic Gadget - defaults): {
  id: 2,
  name: 'Basic Gadget',
  manufacturerid: null,
  barcode: null,
  price: '0.00',
  quantity: 0
}

Attempting to create a manufacturer...
Created Manufacturer: { id: 1, name: 'Awesome Inc.', address: '123 Tech Road' }

Attempting to update item ID 1 with manufacturer ID 1...
Updated Item (with manufacturer linked): { id: 1, name: 'Original Item', manufacturerid: 1 }

Attempting to read item with ID: 1 (should have manufacturer details)...
Read Item (with manufacturer details): {
  id: 1,
  name: 'Original Item',
  manufacturerid: 1,
  manufacturer_name: 'Awesome Inc.',
  manufacturer_address: '123 Tech Road'
}

Attempting to update item name for ID: 1...
Updated Item Name: { id: 1, name: 'Super Original Item', manufacturerid: 1 }

Attempting to update item ID 1 to set manufacturerId to NULL...
Updated Item (manufacturer unlinked): { id: 1, name: 'Super Original Item', manufacturerid: null }

Attempting to get item by barcode: DW123456789...
Get Item By Barcode Result: {
  id: 1,
  name: 'Deluxe Widget',
  manufacturerid: 1,
  barcode: 'DW123456789',
  price: '179.99',
  quantity: 45,
  manufacturer_name: 'Awesome Inc.',
  manufacturer_address: '123 Tech Road'
}

Attempting to search for items with name containing 'Widget'...
Search Results (should include Deluxe Widget): [
  {
    id: 1,
    name: 'Deluxe Widget',
    manufacturerid: 1,
    barcode: 'DW123456789',
    price: '179.99',
    quantity: 45,
    manufacturer_name: 'Awesome Inc.',
    manufacturer_address: '123 Tech Road'
  }
]

Attempting to delete Deluxe Widget (ID: 1)...
Deluxe Widget (ID: 1) deleted.
Attempting to delete Basic Gadget (ID: 2)...
Basic Gadget (ID: 2) deleted.

Attempting to delete manufacturer with ID: 1...
Manufacturer Deletion Result: true

CRUD demonstration finished. Closing connection pool.
```
The `id` values and exact formatting might differ slightly based on your database state and console output (e.g., presence of manufacturer search logs).

## Project Structure
*   `app.js`: Contains the main application logic:
    *   PostgreSQL connection pool setup.
    *   CRUD functions for `items` and `manufacturers` (see "Available Functions" below).
    *   Text search functions `searchItemsByName` and `searchManufacturers`.
    *   An example usage function `demonstrateCRUD`.
*   `package.json`: Defines project metadata, scripts (like `start`), and dependencies (e.g., `pg`).
*   `setup.sql`: An SQL script that creates the `items` and `manufacturers` tables, defines their relationship, enables the `pg_trgm` extension, and sets up necessary indexes.
*   `readme.md`: This file, providing setup and usage instructions.

## Available Functions (in `app.js`)

### Item Functions
*   `createItem(details)`: Creates a new item. The `details` object can contain:
    *   `name` (String, required): Name of the item.
    *   `manufacturerId` (Integer, optional, default: `null`): ID of the linked manufacturer.
    *   `barcode` (String, optional, default: `null`): Unique barcode for the item.
    *   `price` (Number, optional, default: `0.00`): Price of the item.
    *   `quantity` (Integer, optional, default: `0`): Quantity in stock.
*   `readItem(id)`: Retrieves an item by its `id`. Includes joined manufacturer details and new fields (`barcode`, `price`, `quantity`).
*   `updateItem(id, updates)`: Updates an item. The `updates` object can contain `{ name, manufacturerId, barcode, price, quantity }`. `manufacturerId` can be set to a new ID or `null`.
*   `deleteItem(id)`: Deletes an item by its `id`.
*   `searchItemsByName(searchText)`: Performs a case-insensitive, partial search on item names. Results include joined manufacturer details and new fields (`barcode`, `price`, `quantity`).
*   `getItemByBarcode(barcode)`: Retrieves an item (including manufacturer details and new fields) by its unique `barcode`. Returns `null` if not found or on error.

### Manufacturer Functions
*   `createManufacturer(name, address)`: Creates a new manufacturer.
*   `readManufacturer(id)`: Retrieves a manufacturer by its `id`.
*   `updateManufacturer(id, newName, newAddress)`: Updates a manufacturer's details. Supports partial updates (e.g., you can provide only `newName` or only `newAddress`).
*   `deleteManufacturer(id)`: Deletes a manufacturer by its `id`. Items previously linked to this manufacturer will have their `manufacturerId` set to `NULL` due to the `ON DELETE SET NULL` constraint.
*   `searchManufacturers(searchText)`: Searches for manufacturers where the `name` OR `address` field matches the `searchText` using a case-insensitive, partial match. This search benefits from the GiST indexes on `manufacturers.name` and `manufacturers.address`.
