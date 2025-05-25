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
    *   Creates GiST indexes for text search on `items.name`, `manufacturers.name`, and `manufacturers.address`.
    *   Creates standard indexes for faster joins and lookups on `items.manufacturerId` and `items.barcode`.
    *   Creates the `transactions` table:
        ```sql
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            transaction_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            overall_total_price DECIMAL(10, 2) NOT NULL
        );
        ```
    *   Creates the `transaction_items` table, linking items to transactions:
        ```sql
        CREATE TABLE IF NOT EXISTS transaction_items (
            id SERIAL PRIMARY KEY,
            transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
            item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
            quantity_sold INTEGER NOT NULL,
            price_per_unit_at_sale DECIMAL(10, 2) NOT NULL,
            line_item_total_price DECIMAL(10, 2) NOT NULL
        );
        ```
    *   Creates indexes on `transaction_items` for `transaction_id` and `item_id` to improve query performance.


   Execute the script using a tool like `psql`:
   ```bash
   psql -U your_username -d your_database_name -f setup.sql
   ```
   Replace `your_username` and `your_database_name` with your actual PostgreSQL username and database name. The script uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` where appropriate, making it re-runnable.

**d. Configure Environment Variables:**
   Database connection details are managed through environment variables. This project uses the `dotenv` package to load these variables from a `.env` file at runtime.

   1.  **Create a `.env` file:**
       Copy the sample environment file to a new file named `.env`:
       ```bash
       cp .env.sample .env
       ```
   2.  **Edit `.env`:**
       Open the newly created `.env` file and update the placeholder values with your actual PostgreSQL server configuration:
       ```dotenv
       DB_USER=your_postgres_user
       DB_HOST=localhost
       DB_NAME=your_database_name
       DB_PASS=your_postgres_password
       DB_PORT=5432
       ```
       Replace `your_postgres_user`, `localhost`, `your_database_name`, `your_postgres_password`, and `5432` (if your port is different) with your specific details.

### 2. Install Dependencies

**a. Clone the Repository (or Download Files):**
   If you're using Git, clone the repository:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```
   Otherwise, download the project files (`app.js`, `package.json`) and navigate to the project directory in your terminal.

**b. Install npm Packages:**
   In the project directory, run the following command to install the necessary dependencies (including `pg` for PostgreSQL and `dotenv` for environment variable management) listed in `package.json`:
   ```bash
   npm install
   ```
   This command reads the `package.json` file and installs all listed production dependencies.

## Running the Application
Once the setup and configuration (including your `.env` file) are complete, you can run the application. The `demonstrateCRUD` function in `app.js` will showcase various operations, including interactions between items and manufacturers.

Execute the following command in your terminal from the project root directory:
```bash
node app.js
```

**Expected Output:**
The script will run the `demonstrateCRUD` function. The output will showcase creation of items and manufacturers, linking them, updating details, performing searches, recording sales transactions (which updates item stock), fetching transaction details, and finally, cleaning up. Key parts of the output will resemble:
```
Attempting to create an item with full details...
Created Item (Deluxe Widget): { id: 1, ..., quantity: 50 }
Attempting to create a second item with minimal details...
Created Item (Basic Gadget): { id: 2, ..., quantity: 100 }

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
Get Item By Barcode Result: { id: 1, ..., quantity: 45, ...}

--- Transaction Demonstration ---
Attempting to record a transaction...
Transaction Recorded: { transactionId: 1, ..., items_sold_count: 2 }
Attempting to get transaction details for ID: 1...
Transaction Details: {
  "transaction": { "id": 1, "transaction_date": "...", "overall_total_price": "..." },
  "items": [
    { "id": 1, "transaction_id": 1, "item_id": 1, "quantity_sold": 2, ..., "item_name": "Deluxe Widget", ... },
    { "id": 2, "transaction_id": 1, "item_id": 2, "quantity_sold": 1, ..., "item_name": "Basic Gadget", ... }
  ]
}
Verifying item quantities after transaction...
Deluxe Widget quantity after sale (should be 43): 43
Basic Gadget quantity after sale (should be 99): 99
--- End Transaction Demonstration ---

Attempting to delete Deluxe Widget (ID: 1)...
Attempting to delete Basic Gadget (ID: 2)...

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

### Transaction Functions
*   `recordTransaction(overall_total_price, items_sold)`:
    *   Purpose: Records a sales transaction, including all items sold, their prices at the time of sale, and updates the stock quantity for each sold item in the `items` table.
    *   `overall_total_price` (Number): The total price for the entire transaction.
    *   `items_sold` (Array): An array of objects, where each object represents an item sold and must have the following structure:
        ```javascript
        {
          itemId: Integer, // ID of the item from the 'items' table
          quantitySold: Integer, // How many units of this item were sold
          pricePerUnitAtSale: Number, // The price of one unit of this item at the time of sale
          lineItemTotalPrice: Number // Total price for this line (quantitySold * pricePerUnitAtSale)
        }
        ```
    *   Database Transaction: This function uses a database transaction to ensure that all operations (inserting into `transactions`, `transaction_items`, and updating `items` stock) are completed successfully or rolled back if any error occurs.
    *   Stock Management: The `quantity` of each item in the `items` table is decremented by `quantitySold`.
*   `getTransactionDetails(transactionId)`:
    *   Purpose: Retrieves a specific transaction along with all its line items.
    *   `transactionId` (Integer): The ID of the transaction to retrieve.
    *   Return Value: An object containing the main transaction record and an array of its items. Item details include `item_name` and `item_barcode` by joining with the `items` table. Example structure:
        ```javascript
        {
          transaction: { id: 1, transaction_date: "...", overall_total_price: "123.45", ... },
          items: [
            { id: 1, transaction_id: 1, item_id: 101, quantity_sold: 2, ..., item_name: "Widget A", item_barcode: "BC123" },
            { id: 2, transaction_id: 1, item_id: 102, quantity_sold: 1, ..., item_name: "Gadget B", item_barcode: "BC456" }
          ]
        }
        ```
        Returns `null` if the transaction is not found or an error occurs.
