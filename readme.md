# Node.js PostgreSQL CRUD Template

## Description
This project provides a simple template for performing CRUD (Create, Read, Update, Delete) operations on a PostgreSQL database using Node.js. It features a connection pool implemented with the `pg` (node-postgres) library for efficient database interactions, and includes functionality for item, manufacturer, transaction, and cashier management.

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

**b. Connect to your Database:**
   Connect to your newly created database using `psql` or your preferred GUI tool.

**c. Run the Setup Script (`setup.sql`):**
   The `setup.sql` script is provided to initialize your database schema. It performs the following actions:
    *   Enables the `pg_trgm` extension for efficient trigram-based text searching.
    *   Creates the `manufacturers` table.
    *   Creates the `cashiers` table:
        ```sql
        CREATE TABLE IF NOT EXISTS cashiers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL, -- For storing bcrypt hashes
            address TEXT NOT NULL, -- New: Cashier's address
            join_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        -- Index for text search on cashier name
        CREATE INDEX idx_cashiers_name_gist ON cashiers USING gist (name gist_trgm_ops); -- New
        ```
    *   Creates the `items` table with inventory fields and a foreign key to `manufacturers`.
    *   Creates the `transactions` table, including a `cashier_id` foreign key.
    *   Creates the `transaction_items` table, linking items to transactions.
    *   Creates various GiST and standard indexes for performance across tables.

   Execute the script using `psql`:
   ```bash
   psql -U your_username -d your_database_name -f setup.sql
   ```
   Replace `your_username` and `your_database_name` with your actual PostgreSQL username and database name. The script is designed to be re-runnable.

**d. Configure Environment Variables:**
   Database connection details are managed through environment variables. This project uses the `dotenv` package to load these variables from a `.env` file.

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

### 2. Install Dependencies

**a. Clone the Repository (or Download Files):**
   (As previously described)

**b. Install npm Packages:**
   In the project directory, run the following command to install the necessary dependencies (including `pg`, `dotenv`, and `bcrypt`) listed in `package.json`:
   ```bash
   npm install
   ```
   This command reads the `package.json` file and installs all listed production dependencies.

## Running the Application
Once the setup and configuration are complete, you can run the application. The `demonstrateCRUD` function in `app.js` will showcase various operations.

Execute the following command in your terminal from the project root directory:
```bash
node app.js
```

**Expected Output:**
The script will demonstrate creation of items, manufacturers, and cashiers (now including address); authentication of cashiers; searching for cashiers; recording of sales transactions; fetching transaction details; and finally, cleaning up. The output will reflect these operations.

## Security Note
**Password Handling:** Passwords for cashiers are hashed using `bcrypt` for security. Plain text passwords are never stored in the database.

## Project Structure
*   `app.js`: Contains the main application logic.
*   `package.json`: Defines project metadata, scripts, and dependencies.
*   `setup.sql`: SQL script to create all tables, relationships, and indexes.
*   `.env.sample`: Sample environment file.
*   `.gitignore`: Specifies intentionally untracked files.
*   `readme.md`: This file.

## Available Functions (in `app.js`)

### Item Functions
(As previously described)

### Manufacturer Functions
(As previously described)

### Cashier Functions
*   `createCashier(name, password, address)`:
    *   Purpose: Creates a new cashier. The `address` parameter is new and required.
    *   Password Handling: The provided `password` is automatically hashed using `bcrypt` before storage.
    *   Return Value: An object containing the new cashier's `id`, `name`, `join_date`, and `address`.
*   `authenticateCashier(name, password)`:
    *   Purpose: Verifies a cashier's credentials.
    *   Password Handling: Uses `bcrypt.compare` to securely compare the provided password against the stored hash.
    *   Return Value: An object with `id`, `name`, `join_date`, and `address` on successful authentication; `null` otherwise.
*   `getCashierById(cashierId)`:
    *   Purpose: Retrieves a cashier's details (excluding password hash) by their ID.
    *   Return Value: An object with `id`, `name`, `join_date`, and `address`; `null` if not found.
*   `searchCashiersByName(searchText)`:
    *   Purpose: Searches for cashiers by name using a case-insensitive, partial match. This search benefits from the GiST index on the `name` column.
    *   `searchText` (String): The text to search for in cashier names.
    *   Return Value: An array of cashier objects, each containing `id`, `name`, `join_date`, and `address`. Returns an empty array if no matches are found or on error.

### Transaction Functions
(As previously described, `recordTransaction` now links to `cashier_id`, and `getTransactionDetails` can include `cashier_name`)
