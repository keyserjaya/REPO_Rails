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
    *   Creates the `items` table with a foreign key to `manufacturers` (details as before).
    *   Creates GiST indexes for text search:
        *   `idx_items_name_gist` on `items.name`.
        *   `idx_manufacturers_name_gist` on `manufacturers.name`.
        *   `idx_manufacturers_address_gist` on `manufacturers.address`.
    *   Creates a standard index (`idx_items_manufacturer_id`) on `items.manufacturerId` for faster joins and lookups.

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
The script will run the `demonstrateCRUD` function. The output will show the creation of items and manufacturers, linking them, updating them, searching for both items and manufacturers, and finally, cleaning them up. Key parts of the output will resemble:
```
Attempting to create an item (no manufacturer initially)...
Created Item (no manufacturer): { id: 1, name: 'Original Item', manufacturerid: null }

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

Attempting to search for items with name containing 'Super'...
Search Results (should include item, no manu details): [
  {
    id: 1,
    name: 'Super Original Item',
    manufacturerid: null,
    manufacturer_name: null,
    manufacturer_address: null
  }
]

Attempting to delete item with ID: 1...
Item Deletion Result: true

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
*   `createItem(name, manufacturerId)`: Creates a new item. `manufacturerId` is optional and can be `null`.
*   `readItem(id)`: Retrieves an item by its `id`. Now includes joined manufacturer details (`manufacturer_name`, `manufacturer_address`) if a manufacturer is linked.
*   `updateItem(id, updates)`: Updates an item. The `updates` object can contain `{ name, manufacturerId }`. `manufacturerId` can be set to a new ID or `null` to unlink.
*   `deleteItem(id)`: Deletes an item by its `id`.
*   `searchItemsByName(searchText)`: Performs a case-insensitive, partial search on item names. Results now include joined manufacturer details.

### Manufacturer Functions
*   `createManufacturer(name, address)`: Creates a new manufacturer.
*   `readManufacturer(id)`: Retrieves a manufacturer by its `id`.
*   `updateManufacturer(id, newName, newAddress)`: Updates a manufacturer's details. Supports partial updates (e.g., you can provide only `newName` or only `newAddress`).
*   `deleteManufacturer(id)`: Deletes a manufacturer by its `id`. Items previously linked to this manufacturer will have their `manufacturerId` set to `NULL` due to the `ON DELETE SET NULL` constraint.
*   `searchManufacturers(searchText)`: Searches for manufacturers where the `name` OR `address` field matches the `searchText` using a case-insensitive, partial match. This search benefits from the GiST indexes on `manufacturers.name` and `manufacturers.address`.
