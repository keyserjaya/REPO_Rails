# Node.js PostgreSQL CRUD & API Project

## Description
This project provides a Node.js backend API for performing CRUD operations on a PostgreSQL database, featuring connection pooling, transaction management, and cashier authentication. It's designed to serve as a backend for applications requiring robust database interactions. A Next.js frontend is also included for user interface.

## Project Structure
The project is organized into two main directories:

*   `backend/`: Contains the Node.js API, database scripts, and all backend-related logic. Key files include `app.js` (main application), `package.json` (dependencies), and `setup.sql` (database schema).
*   `frontend/`: Contains the Next.js frontend application. Key subdirectories include `pages/` (React components for routes), `styles/` (global and component-specific styles), and `public/` (static assets).

This README provides instructions for setting up and running both the backend and the frontend.

## Prerequisites
Before you begin, ensure you have the following installed:
*   **Node.js and npm:** You can download them from [https://nodejs.org/](https://nodejs.org/). This project has been developed with Node.js versions typically used with Next.js (e.g., v18.x or later).
*   **PostgreSQL Server:** You need a running PostgreSQL server. Download and install it from [https://www.postgresql.org/](https://www.postgresql.org/).

## Backend Setup

Follow these steps to set up and run the backend API:

### 1. Navigate to the Backend Directory
Open your terminal and change to the backend directory:
```bash
cd backend
```

### 2. Install Dependencies
Install the necessary npm packages (including `pg`, `dotenv`, and `bcrypt`) listed in `backend/package.json`:
```bash
npm install
```

### 3. Database Configuration

**a. Create a PostgreSQL Database:**
   Open your PostgreSQL terminal (e.g., `psql`) or use a GUI tool like pgAdmin. Create a new database:
   ```sql
   CREATE DATABASE your_database_name;
   ```
   Replace `your_database_name` with your desired database name.

**b. Configure Environment Variables:**
   Database connection details are managed through environment variables.

   1.  **Create a `.env` file in the `backend` directory:**
       Copy the sample environment file:
       ```bash
       cp .env.sample .env
       ```
       (Ensure you are in the `backend` directory when running this command).
   2.  **Edit `backend/.env`:**
       Open `backend/.env` and update the placeholder values with your actual PostgreSQL server configuration.

**c. Run the Database Setup Script:**
   The `setup.sql` script (located in the `backend` directory) initializes your database schema. Connect to your database using `psql` or your preferred GUI tool and execute the script.

   From within the `backend` directory, you can run:
   ```bash
   psql -U your_postgres_user -d your_database_name -f setup.sql
   ```
   Replace `your_postgres_user` and `your_database_name` with your actual credentials.

### 4. Running the Backend Application
Once the setup and configuration are complete, you can start the backend server. Ensure you are in the `backend` directory:
```bash
node app.js
```
Alternatively, if a `start` script is defined in `backend/package.json`:
```bash
npm start
```
The `demonstrateCRUD` function in `app.js` will run, showcasing various API operations.

## Frontend Setup

The frontend is a Next.js application located in the `frontend/` directory.

### 1. Navigate to the frontend directory:
Open a new terminal (or use your existing one) and change to the frontend directory:
```bash
cd frontend
```
(If you were in the `backend/` directory, you might need to `cd ../frontend`.)

### 2. Install dependencies:
Install the necessary npm packages listed in `frontend/package.json`:
```bash
npm install
```

### 3. Run the development server:
Start the Next.js development server:
```bash
npm run dev
```
This will start the Next.js development server, typically on `http://localhost:3000`.
Open your browser and navigate to this address to see the application.
The initial page (`pages/index.js`) is a login form placeholder.

## Security Note
**Password Handling:** Passwords for cashiers (managed by the backend) are hashed using `bcrypt`. Plain text passwords are never stored.

## Backend API Details
(As previously described)

### Database Schema Overview (Managed by `backend/setup.sql`)
(As previously described)

### Available Backend Functions (Exported from `backend/app.js`)
(As previously described: Item Functions, Manufacturer Functions, Cashier Functions, Transaction Functions)

## Project Files
*   `backend/app.js`: Main backend application logic.
*   `backend/package.json`: Backend dependencies and scripts.
*   `backend/setup.sql`: Database schema setup script.
*   `backend/.env.sample`: Sample environment file for backend database configuration.
*   `frontend/pages/index.js`: Main entry point for the frontend (login page).
*   `frontend/pages/cashier.js`: Placeholder for the main cashier application page.
*   `frontend/package.json`: Frontend dependencies and scripts (Next.js).
*   `frontend/styles/globals.css`: Global styles for the frontend.
*   `.gitignore`: Specifies intentionally untracked files for both backend and frontend.
*   `readme.md`: This main project readme.
