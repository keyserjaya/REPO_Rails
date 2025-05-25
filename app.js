require('dotenv').config(); // Added for environment variable configuration
const { Pool } = require('pg');

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

async function searchManufacturers(searchText) {
  let client; // Define client here to be accessible in finally
  try {
    client = await pool.connect();
    const queryText = 'SELECT * FROM manufacturers WHERE name ILIKE $1 OR address ILIKE $1';
    const queryParams = [`%${searchText}%`];
    const result = await client.query(queryText, queryParams);
    return result.rows;
  } catch (err) {
    console.error('Error searching manufacturers:', err);
    return []; // Return empty array on error or if no results
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
      // No fields to update, perhaps return current item data or null if not found
      // For consistency, could call readItem(id) here or simply return null if no update occurs.
      // Let's return the current item by fetching it, to show it's unchanged or does not exist.
      return readItem(id);
    }

    values.push(id); // For WHERE id = $N
    const queryText = `UPDATE items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await client.query(queryText, values);
    return result.rows.length > 0 ? result.rows[0] : null; // Returns items.*
  } catch (err) {
    console.error('Error updating item:', err);
    throw err; // Re-throw error as per original CUD pattern for items
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
    return null; // Return null on error
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function deleteItem(id) { // deleteItem remains unchanged in this subtask
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('DELETE FROM items WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (err) {
    console.error('Error deleting item:', err);
    return false; // Return false on error
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
    return []; // Return empty array on error
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
    throw err; // Re-throw the error
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
    return null; // Return null on error
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
      // No fields to update, return current manufacturer data or null if not found
      return readManufacturer(id);
    }

    values.push(id); // For WHERE id = $N
    const queryText = `UPDATE manufacturers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await client.query(queryText, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error updating manufacturer:', err);
    throw err; // Re-throw the error
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
    throw err; // Re-throw the error
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Transaction Functions

async function recordTransaction(overall_total_price, items_sold) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transactionQuery = 'INSERT INTO transactions (overall_total_price) VALUES ($1) RETURNING id, transaction_date;';
    const transactionResult = await client.query(transactionQuery, [overall_total_price]);
    const transactionId = transactionResult.rows[0].id;
    const transactionDate = transactionResult.rows[0].transaction_date;

    for (const itemSold of items_sold) {
      const transItemQuery = 'INSERT INTO transaction_items (transaction_id, item_id, quantity_sold, price_per_unit_at_sale, line_item_total_price) VALUES ($1, $2, $3, $4, $5);';
      await client.query(transItemQuery, [transactionId, itemSold.itemId, itemSold.quantitySold, itemSold.pricePerUnitAtSale, itemSold.lineItemTotalPrice]);

      const updateItemQtyQuery = 'UPDATE items SET quantity = quantity - $1 WHERE id = $2;';
      await client.query(updateItemQtyQuery, [itemSold.quantitySold, itemSold.itemId]);
    }

    await client.query('COMMIT');
    return { transactionId, transactionDate, overall_total_price, items_sold_count: items_sold.length };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error recording transaction:', err);
    throw err; // Re-throw the error
  } finally {
    client.release();
  }
}

async function getTransactionDetails(transactionId) {
  const client = await pool.connect();
  try {
    const transactionQuery = 'SELECT * FROM transactions WHERE id = $1;';
    const transactionResult = await client.query(transactionQuery, [transactionId]);
    if (transactionResult.rows.length === 0) {
      return null; // Transaction not found
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
    return null; // Return null on error
  } finally {
    client.release();
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
  recordTransaction, // Added new function
  getTransactionDetails // Added new function
};

async function demonstrateCRUD() {
  let newItem, newItem2, manufacturer1;
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

    console.log('\nAttempting to create a second item with minimal details...');
    newItem2 = await createItem({ name: 'Basic Gadget', price: 25.50, quantity: 100, barcode: 'BG987654321' });
    console.log('Created Item (Basic Gadget):', newItem2);


    // Manufacturer setup (remains the same)
    try {
      console.log('\nAttempting to create a manufacturer...');
      manufacturer1 = await createManufacturer('Awesome Inc.', '123 Tech Road');
      console.log('Created Manufacturer:', manufacturer1);

      if (newItem && newItem.id && manufacturer1 && manufacturer1.id) {
        console.log(`\nAttempting to update Deluxe Widget (ID ${newItem.id}) with manufacturer ID ${manufacturer1.id}...`);
        const updatedItemWithManu = await updateItem(newItem.id, { manufacturerId: manufacturer1.id });
        console.log('Updated Deluxe Widget (with manufacturer linked):', updatedItemWithManu);
        newItem = updatedItemWithManu;
      }
    } catch (e) {
      console.error("Error in manufacturer creation/linking part of demo:", e);
    }
    
    // Item operations (remains largely the same, ensure items exist for transaction)
    if (newItem && newItem.id) {
      console.log(`\nAttempting to read Deluxe Widget (ID: ${newItem.id})...`);
      await readItem(newItem.id); // Result not stored, just for demo
      console.log(`\nAttempting to update Deluxe Widget (ID: ${newItem.id}) price and quantity...`);
      newItem = await updateItem(newItem.id, { price: 179.99, quantity: 45 }); // Update and store
    }
    if (newItem2 && newItem2.id) {
      console.log(`\nAttempting to read Basic Gadget (ID: ${newItem2.id})...`);
       await readItem(newItem2.id); // Result not stored
    }

    // Demonstrate Transaction
    let transactionId;
    if (newItem && newItem.id && newItem2 && newItem2.id) {
      console.log('\n--- Transaction Demonstration ---');
      const itemsToSell = [
        { itemId: newItem.id, quantitySold: 2, pricePerUnitAtSale: newItem.price, lineItemTotalPrice: parseFloat(newItem.price) * 2 },
        { itemId: newItem2.id, quantitySold: 1, pricePerUnitAtSale: newItem2.price, lineItemTotalPrice: parseFloat(newItem2.price) * 1 }
      ];
      const overallTotalPrice = itemsToSell.reduce((sum, item) => sum + item.lineItemTotalPrice, 0);

      try {
        console.log('\nAttempting to record a transaction...');
        const transactionResult = await recordTransaction(overallTotalPrice, itemsToSell);
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
        console.error('Error during transaction demonstration:', e);
      }
      console.log('--- End Transaction Demonstration ---');
    }


    // Clean up (remains largely the same)
    if (newItem && newItem.id) {
      console.log(`\nAttempting to delete Deluxe Widget (ID: ${newItem.id})...`);
      await deleteItem(newItem.id);
    }
    if (newItem2 && newItem2.id) {
      console.log(`\nAttempting to delete Basic Gadget (ID: ${newItem2.id})...`);
      await deleteItem(newItem2.id);
    }
    if (manufacturer1 && manufacturer1.id) {
      console.log(`\nAttempting to delete manufacturer (ID: ${manufacturer1.id})...`);
      await deleteManufacturer(manufacturer1.id);
    }

  } catch (error) {
    console.error('Error in overall CRUD demonstration:', error);
  } finally {
    console.log('\nCRUD demonstration finished. Closing connection pool.');
    await pool.end(); // Ensure pool is closed
  }
}

if (require.main === module) {
  demonstrateCRUD();
}
