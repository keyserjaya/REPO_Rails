const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_username', // Placeholder
  host: 'your_host',     // Placeholder
  database: 'your_database', // Placeholder
  password: 'your_password', // Placeholder
  port: 5432,            // Placeholder
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

module.exports = {
  pool,
  createItem,
  readItem,
  updateItem,
  deleteItem,
  searchItemsByName,
  getItemByBarcode, // Added new function
  createManufacturer,
  readManufacturer,
  updateManufacturer,
  deleteManufacturer,
  searchManufacturers
};

async function demonstrateCRUD() {
  let newItem, newItem2;
  try {
    console.log('Attempting to create an item with full details...');
    newItem = await createItem({
      name: 'Deluxe Widget',
      manufacturerId: null, // Will link later
      barcode: 'DW123456789',
      price: 199.99,
      quantity: 50
    });
    console.log('Created Item (Deluxe Widget):', newItem);

    console.log('\nAttempting to create a second item with minimal details...');
    newItem2 = await createItem({ name: 'Basic Gadget' }); // Defaults for other fields
    console.log('Created Item (Basic Gadget - defaults):', newItem2);


    let manufacturer1;
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


    if (newItem && newItem.id) {
      console.log(`\nAttempting to read Deluxe Widget (ID: ${newItem.id})...`);
      const readResult = await readItem(newItem.id);
      console.log('Read Deluxe Widget (with details):', readResult);

      console.log(`\nAttempting to update Deluxe Widget (ID: ${newItem.id}) price and quantity...`);
      const updatedDetails = await updateItem(newItem.id, { price: 179.99, quantity: 45 });
      console.log('Updated Deluxe Widget (price/quantity):', updatedDetails);
      newItem = updatedDetails;

      if (newItem.barcode) {
        console.log(`\nAttempting to get item by barcode: ${newItem.barcode}...`);
        const itemByBarcode = await getItemByBarcode(newItem.barcode);
        console.log('Get Item By Barcode Result:', itemByBarcode);
      }
    }
    
    if (newItem2 && newItem2.id) {
        console.log(`\nAttempting to read Basic Gadget (ID: ${newItem2.id})...`);
        const readGadget = await readItem(newItem2.id);
        console.log('Read Basic Gadget (defaults):', readGadget);
    }


      // Demonstrate search (item name should be 'Super Original Item' and have no manu details now)
      console.log(`\nAttempting to search for items with name containing 'Widget'...`);
      const searchResults = await searchItemsByName('Widget');
      console.log('Search Results (should include Deluxe Widget):', searchResults);
      
      // Clean up
      if (newItem && newItem.id) {
        console.log(`\nAttempting to delete Deluxe Widget (ID: ${newItem.id})...`);
        await deleteItem(newItem.id);
        console.log(`Deluxe Widget (ID: ${newItem.id}) deleted.`);
      }
      if (newItem2 && newItem2.id) {
        console.log(`\nAttempting to delete Basic Gadget (ID: ${newItem2.id})...`);
        await deleteItem(newItem2.id);
        console.log(`Basic Gadget (ID: ${newItem2.id}) deleted.`);
      }


      // Demonstrate searching manufacturers
      if (manufacturer1 && manufacturer1.id) {
        console.log(`\nAttempting to search for manufacturer with text 'Awesome'...`);
        const searchManuResults = await searchManufacturers('Awesome');
        console.log('Search Manufacturer Results (should find Awesome Inc.):', searchManuResults);
        
        // Clean up: delete the manufacturer
        console.log(`\nAttempting to delete manufacturer with ID: ${manufacturer1.id}...`);
        const deleteManuResult = await deleteManufacturer(manufacturer1.id);
        console.log('Manufacturer Deletion Result:', deleteManuResult);
      }

    } catch (error) {
    console.error('Error in CRUD demonstration:', error);
  } finally {
    console.log('\nCRUD demonstration finished. Closing connection pool.');
    await pool.end(); // Ensure pool is closed
  }
}

if (require.main === module) {
  demonstrateCRUD();
}
