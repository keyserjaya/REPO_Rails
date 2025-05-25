require('dotenv').config(); // Added for environment variable configuration
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // Added for password hashing
const saltRounds = 10; // Define salt rounds for bcrypt

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function createItem(details) { // Signature changed to accept a details object
  let client;
  try {
    const { name, manufacturerId = null, barcode = null, price = 0.00, quantity = 0 } = details;
    // Validate required fields like name
    if (!name) {
      throw new Error('Item name is required.');
    }
    client = await pool.connect();
    const queryText = 'INSERT INTO items (name, manufacturerId, barcode, price, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *;';
    const result = await client.query(queryText, [name, manufacturerId, barcode, price, quantity]);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating item:', err);
    throw err; // Re-throw the error
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function readItem(id) {
  let client;
  try {
    client = await pool.connect();
    const queryText = `
      SELECT
        items.*,
        m.name AS manufacturer_name,
        m.address AS manufacturer_address
      FROM items
      LEFT JOIN manufacturers m ON items.manufacturerId = m.id
      WHERE items.id = $1;
    `;
    const result = await client.query(queryText, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error reading item:', err);
    return null; // Return null on error
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function updateItem(id, updates) { // Changed signature to (id, updates)
  let client;
  try {
    client = await pool.connect();
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    // Allow manufacturerId to be explicitly set to null or a new value
    if (updates.hasOwnProperty('manufacturerId')) { // Check property existence for null
      fields.push(`manufacturerId = $${paramCount++}`);
      values.push(updates.manufacturerId);
    }
    if (updates.barcode !== undefined) {
      fields.push(`barcode = $${paramCount++}`);
      values.push(updates.barcode);
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${paramCount++}`);
      values.push(updates.price);
    }
    if (updates.quantity !== undefined) {
      fields.push(`quantity = $${paramCount++}`);
      values.push(updates.quantity);
    }

    if (fields.length === 0) {
      return readItem(id);
    }

    values.push(id); // For WHERE id = $N
    const queryText = `UPDATE items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await client.query(queryText, values);
    return result.rows.length > 0 ? result.rows[0] : null; // Returns items.*
  } catch (err) {
    console.error('Error updating item:', err);
    throw err; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getItemByBarcode(barcode) {
  let client;
  try {
    client = await pool.connect();
    const queryText = `
      SELECT
        items.*,
        m.name AS manufacturer_name,
        m.address AS manufacturer_address
      FROM items
      LEFT JOIN manufacturers m ON items.manufacturerId = m.id
      WHERE items.barcode = $1;
    `;
    const result = await client.query(queryText, [barcode]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error getting item by barcode:', err);
    return null; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function deleteItem(id) { 
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('DELETE FROM items WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (err) {
    console.error('Error deleting item:', err);
    return false; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function searchItemsByName(searchText) {
  let client;
  try {
    client = await pool.connect();
    const queryText = `
      SELECT
        items.*,
        m.name AS manufacturer_name,
        m.address AS manufacturer_address
      FROM items
      LEFT JOIN manufacturers m ON items.manufacturerId = m.id
      WHERE items.name ILIKE $1;
    `;
    const queryParams = [`%${searchText}%`];
    const result = await client.query(queryText, queryParams);
    return result.rows;
  } catch (err) {
    console.error('Error searching items by name:', err);
    return []; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

// CRUD Functions for Manufacturers
async function createManufacturer(name, address) {
  let client;
  try {
    client = await pool.connect();
    const queryText = 'INSERT INTO manufacturers (name, address) VALUES ($1, $2) RETURNING *';
    const result = await client.query(queryText, [name, address]);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating manufacturer:', err);
    throw err; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function readManufacturer(id) {
  let client;
  try {
    client = await pool.connect();
    const queryText = 'SELECT * FROM manufacturers WHERE id = $1';
    const result = await client.query(queryText, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error reading manufacturer:', err);
    return null; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function updateManufacturer(id, newName, newAddress) {
  let client;
  try {
    client = await pool.connect();
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (newName !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(newName);
    }
    if (newAddress !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(newAddress);
    }

    if (fields.length === 0) {
      return readManufacturer(id);
    }

    values.push(id); 
    const queryText = `UPDATE manufacturers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await client.query(queryText, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error updating manufacturer:', err);
    throw err; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function deleteManufacturer(id) {
  let client;
  try {
    client = await pool.connect();
    const queryText = 'DELETE FROM manufacturers WHERE id = $1 RETURNING id';
    const result = await client.query(queryText, [id]);
    return result.rowCount > 0;
  } catch (err) {
    console.error('Error deleting manufacturer:', err);
    throw err; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function searchManufacturers(searchText) {
  let client; 
  try {
    client = await pool.connect();
    const queryText = 'SELECT * FROM manufacturers WHERE name ILIKE $1 OR address ILIKE $1';
    const queryParams = [`%${searchText}%`];
    const result = await client.query(queryText, queryParams);
    return result.rows;
  } catch (err) {
    console.error('Error searching manufacturers:', err);
    return []; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Transaction Functions
async function recordTransaction(overall_total_price, items_sold, cashier_id) { 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transactionQuery = 'INSERT INTO transactions (overall_total_price, cashier_id) VALUES ($1, $2) RETURNING id, transaction_date, cashier_id;';
    const transactionResult = await client.query(transactionQuery, [overall_total_price, cashier_id]);
    const transactionId = transactionResult.rows[0].id;
    const transactionDate = transactionResult.rows[0].transaction_date;
    const recordedCashierId = transactionResult.rows[0].cashier_id; 

    for (const itemSold of items_sold) {
      const transItemQuery = 'INSERT INTO transaction_items (transaction_id, item_id, quantity_sold, price_per_unit_at_sale, line_item_total_price) VALUES ($1, $2, $3, $4, $5);';
      await client.query(transItemQuery, [transactionId, itemSold.itemId, itemSold.quantitySold, itemSold.pricePerUnitAtSale, itemSold.lineItemTotalPrice]);

      const updateItemQtyQuery = 'UPDATE items SET quantity = quantity - $1 WHERE id = $2;';
      await client.query(updateItemQtyQuery, [itemSold.quantitySold, itemSold.itemId]);
    }

    await client.query('COMMIT');
    return { transactionId, transactionDate, overall_total_price, cashier_id: recordedCashierId, items_sold_count: items_sold.length };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error recording transaction:', err);
    throw err; 
  } finally {
    client.release();
  }
}

async function getTransactionDetails(transactionId) {
  const client = await pool.connect();
  try {
    const transactionQuery = `
      SELECT t.*, c.name as cashier_name 
      FROM transactions t
      LEFT JOIN cashiers c ON t.cashier_id = c.id
      WHERE t.id = $1;
    `;
    const transactionResult = await client.query(transactionQuery, [transactionId]);
    if (transactionResult.rows.length === 0) {
      return null; 
    }
    const transactionData = transactionResult.rows[0];

    const itemsQuery = `
      SELECT ti.*, i.name as item_name, i.barcode as item_barcode
      FROM transaction_items ti
      JOIN items i ON ti.item_id = i.id
      WHERE ti.transaction_id = $1
      ORDER BY ti.id;`;
    const itemsResult = await client.query(itemsQuery, [transactionId]);
    const itemsData = itemsResult.rows;

    return { transaction: transactionData, items: itemsData };
  } catch (err) {
    console.error('Error getting transaction details:', err);
    return null; 
  } finally {
    client.release();
  }
}

// Cashier Management and Authentication Functions
async function createCashier(name, password, address) { // Added address to signature
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // Updated SQL query and parameters to include address, and return address
    const queryText = 'INSERT INTO cashiers (name, password_hash, address) VALUES ($1, $2, $3) RETURNING id, name, join_date, address;';
    const result = await client.query(queryText, [name, passwordHash, address]);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating cashier:', err);
    throw err; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function authenticateCashier(name, password) {
  const client = await pool.connect();
  try {
    // Updated SQL query to select address
    const queryText = 'SELECT id, name, password_hash, join_date, address FROM cashiers WHERE name = $1;';
    const result = await client.query(queryText, [name]);
    if (result.rows.length === 0) {
      return null; 
    }
    const cashier = result.rows[0];
    const match = await bcrypt.compare(password, cashier.password_hash);
    if (match) {
      // Updated returned object to include address
      return { id: cashier.id, name: cashier.name, join_date: cashier.join_date, address: cashier.address };
    } else {
      return null; 
    }
  } catch (err) {
    console.error('Error authenticating cashier:', err);
    return null; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getCashierById(cashierId) {
  const client = await pool.connect();
  try {
    // Updated SQL query to select address
    const queryText = 'SELECT id, name, join_date, address FROM cashiers WHERE id = $1;';
    const result = await client.query(queryText, [cashierId]);
    if (result.rows.length === 0) {
      return null; 
    }
    // Returned object already includes address due to SELECT * or specific selection
    return result.rows[0];
  } catch (err) {
    console.error('Error getting cashier by ID:', err);
    return null; 
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function searchCashiersByName(searchText) { // New function
  let client;
  try {
    client = await pool.connect();
    const queryText = 'SELECT id, name, join_date, address FROM cashiers WHERE name ILIKE $1;';
    const queryParams = [`%${searchText}%`];
    const result = await client.query(queryText, queryParams);
    return result.rows; // Returns an array of cashier objects
  } catch (err) {
    console.error('Error searching cashiers by name:', err);
    return []; // Return empty array on error
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  pool,
  createItem,
  readItem,
  updateItem,
  deleteItem,
  searchItemsByName,
  getItemByBarcode,
  createManufacturer,
  readManufacturer,
  updateManufacturer,
  deleteManufacturer,
  searchManufacturers,
  recordTransaction, 
  getTransactionDetails,
  createCashier,
  authenticateCashier,
  getCashierById,
  searchCashiersByName // Added new function to exports
};

async function demonstrateCRUD() {
  let newItem, newItem2, manufacturer1, newCashier; 
  try {
    console.log('Attempting to create an item with full details...');
    newItem = await createItem({
      name: 'Deluxe Widget',
      manufacturerId: null,
      barcode: 'DW123456789',
      price: 199.99,
      quantity: 50
    });
    console.log('Created Item (Deluxe Widget):', newItem);

    newItem2 = await createItem({ name: 'Basic Gadget', price: 25.50, quantity: 100, barcode: 'BG987654321' });
    console.log('Created Item (Basic Gadget):', newItem2);

    manufacturer1 = await createManufacturer('Awesome Inc.', '123 Tech Road');
    console.log('Created Manufacturer:', manufacturer1);

    if (newItem && newItem.id && manufacturer1 && manufacturer1.id) {
      console.log(`\nAttempting to update Deluxe Widget (ID ${newItem.id}) with manufacturer ID ${manufacturer1.id}...`);
      newItem = await updateItem(newItem.id, { manufacturerId: manufacturer1.id }); 
      console.log('Updated Deluxe Widget (with manufacturer linked):', newItem);
    }

    // --- Cashier Demonstration ---
    console.log('\n--- Cashier Demonstration ---');
    try {
      console.log("Attempting to create cashier 'jane.doe' with address...");
      newCashier = await createCashier('jane.doe', 'superSecurePass456', '456 Oak St, Anytown'); // Added address
      console.log('Created Cashier:', newCashier);

      if (newCashier && newCashier.id) {
        console.log("\nAttempting to authenticate 'jane.doe' with correct password...");
        const authCashierCorrect = await authenticateCashier('jane.doe', 'superSecurePass456');
        console.log('Authentication Result (Correct Pass):', authCashierCorrect ? { id: authCashierCorrect.id, name: authCashierCorrect.name, address: authCashierCorrect.address } : null);

        console.log("\nAttempting to authenticate 'jane.doe' with incorrect password...");
        const authCashierIncorrect = await authenticateCashier('jane.doe', 'wrongPassword');
        console.log('Authentication Result (Incorrect Pass):', authCashierIncorrect);
        
        console.log(`\nAttempting to get cashier by ID: ${newCashier.id}...`);
        const fetchedCashier = await getCashierById(newCashier.id);
        console.log('Get Cashier By ID Result:', fetchedCashier ? { id: fetchedCashier.id, name: fetchedCashier.name, address: fetchedCashier.address } : null);

        console.log("\nAttempting to search for cashiers with name containing 'jane'...");
        const searchResultsCashier = await searchCashiersByName('jane');
        console.log('Search Cashiers By Name Result:', searchResultsCashier.map(c => ({id: c.id, name: c.name, address: c.address })));
      }
    } catch (e) {
      console.error('Error during cashier demonstration:', e.message); 
    }
    console.log('--- End Cashier Demonstration ---');
    
    if (newItem && newItem.id) {
      console.log(`\nAttempting to read Deluxe Widget (ID: ${newItem.id})...`);
      await readItem(newItem.id); 
      console.log(`\nAttempting to update Deluxe Widget (ID: ${newItem.id}) price and quantity...`);
      newItem = await updateItem(newItem.id, { price: 179.99, quantity: 45 }); 
    }
    if (newItem2 && newItem2.id) {
      console.log(`\nAttempting to read Basic Gadget (ID: ${newItem2.id})...`);
       await readItem(newItem2.id); 
    }

    let transactionId;
    const cashierIdForTransaction = newCashier && newCashier.id ? newCashier.id : null; 

    if (newItem && newItem.id && newItem2 && newItem2.id) {
      console.log('\n--- Transaction Demonstration ---');
      const itemsToSell = [
        { itemId: newItem.id, quantitySold: 2, pricePerUnitAtSale: newItem.price, lineItemTotalPrice: parseFloat(newItem.price) * 2 },
        { itemId: newItem2.id, quantitySold: 1, pricePerUnitAtSale: newItem2.price, lineItemTotalPrice: parseFloat(newItem2.price) * 1 }
      ];
      const overallTotalPrice = itemsToSell.reduce((sum, item) => sum + item.lineItemTotalPrice, 0);

      try {
        console.log('\nAttempting to record a transaction...');
        const transactionResult = await recordTransaction(overallTotalPrice, itemsToSell, cashierIdForTransaction); 
        console.log('Transaction Recorded:', transactionResult);
        transactionId = transactionResult.transactionId;

        if (transactionId) {
          console.log(`\nAttempting to get transaction details for ID: ${transactionId}...`);
          const details = await getTransactionDetails(transactionId);
          console.log('Transaction Details:', JSON.stringify(details, null, 2));
        }

        console.log('\nVerifying item quantities after transaction...');
        const item1AfterSale = await readItem(newItem.id);
        const item2AfterSale = await readItem(newItem2.id);
        console.log(`Deluxe Widget quantity after sale (should be 43): ${item1AfterSale ? item1AfterSale.quantity : 'N/A'}`);
        console.log(`Basic Gadget quantity after sale (should be 99): ${item2AfterSale ? item2AfterSale.quantity : 'N/A'}`);

      } catch (e) {
        console.error('Error during transaction demonstration:', e.message); 
      }
      console.log('--- End Transaction Demonstration ---');
    }

    // Clean up
    if (newItem && newItem.id) await deleteItem(newItem.id);
    if (newItem2 && newItem2.id) await deleteItem(newItem2.id);
    if (manufacturer1 && manufacturer1.id) await deleteManufacturer(manufacturer1.id);
    if (newCashier && newCashier.id) { 
        console.log(`\nAttempting to clean up cashier ID: ${newCashier.id}`);
        // Placeholder for deleteCashier if it existed
    }

  } catch (error) {
    console.error('Error in overall CRUD demonstration:', error.message); 
  } finally {
    console.log('\nCRUD demonstration finished. Closing connection pool.');
    await pool.end(); 
  }
}

if (require.main === module) {
  demonstrateCRUD();
}
