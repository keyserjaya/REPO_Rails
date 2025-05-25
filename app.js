const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_username', // Placeholder
  host: 'your_host',     // Placeholder
  database: 'your_database', // Placeholder
  password: 'your_password', // Placeholder
  port: 5432,            // Placeholder
});

async function createItem(name, manufacturerId = null) { // Added manufacturerId, defaults to null
  let client;
  try {
    client = await pool.connect();
    // Use manufacturerId in the query, allowing it to be null
    const queryText = 'INSERT INTO items (name, manufacturerId) VALUES ($1, $2) RETURNING *';
    const result = await client.query(queryText, [name, manufacturerId]);
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
    if (updates.manufacturerId !== undefined) {
      fields.push(`manufacturerId = $${paramCount++}`);
      values.push(updates.manufacturerId);
    } else if (updates.hasOwnProperty('manufacturerId') && updates.manufacturerId === null) {
      // Handle explicit null for manufacturerId if it's the only property
      // This case is mostly covered by `updates.manufacturerId !== undefined` when null is passed
      // but being explicit if only `manufacturerId: null` is passed.
       fields.push(`manufacturerId = $${paramCount++}`);
       values.push(null);
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
  createManufacturer,
  readManufacturer,
  updateManufacturer,
  deleteManufacturer,
  searchManufacturers // Added new function
};

async function demonstrateCRUD() {
  let newItem;
  try {
    console.log('Attempting to create an item (no manufacturer initially)...');
    // Pass name and undefined/null for manufacturerId for createItem
    newItem = await createItem('Original Item', null); 
    console.log('Created Item (no manufacturer):', newItem);

    let manufacturer1;
    try {
      console.log('\nAttempting to create a manufacturer...');
      manufacturer1 = await createManufacturer('Awesome Inc.', '123 Tech Road');
      console.log('Created Manufacturer:', manufacturer1);

      if (newItem && newItem.id && manufacturer1 && manufacturer1.id) {
        console.log(`\nAttempting to update item ID ${newItem.id} with manufacturer ID ${manufacturer1.id}...`);
        // Update item to link to manufacturer
        const updatedItemWithManu = await updateItem(newItem.id, { manufacturerId: manufacturer1.id });
        console.log('Updated Item (with manufacturer linked):', updatedItemWithManu);
        // Store this version for further operations
        newItem = updatedItemWithManu; 
      }
    } catch (e) {
      console.error("Error in manufacturer creation/linking part of demo:", e);
    }


    if (newItem && newItem.id) {
      console.log(`\nAttempting to read item with ID: ${newItem.id} (should have manufacturer details)...`);
      const readResult = await readItem(newItem.id);
      console.log('Read Item (with manufacturer details):', readResult);

      console.log(`\nAttempting to update item name for ID: ${newItem.id}...`);
      const updatedItemName = await updateItem(newItem.id, { name: 'Super Original Item' });
      console.log('Updated Item Name:', updatedItemName);
      newItem = updatedItemName; // Store this version

      if (manufacturer1 && manufacturer1.id) {
        console.log(`\nAttempting to update item ID ${newItem.id} to set manufacturerId to NULL...`);
        const updatedItemNoManu = await updateItem(newItem.id, { manufacturerId: null });
        console.log('Updated Item (manufacturer unlinked):', updatedItemNoManu);
        newItem = updatedItemNoManu; // Store this version
      }

      // Demonstrate search (item name should be 'Super Original Item' and have no manu details now)
      console.log(`\nAttempting to search for items with name containing 'Super'...`);
      const searchResults = await searchItemsByName('Super');
      console.log('Search Results (should include item, no manu details):', searchResults);

      console.log(`\nAttempting to search for items with name containing 'XYZ'...`);
      const searchResultsXYZ = await searchItemsByName('XYZ');
      console.log('Search Results XYZ (should be empty):', searchResultsXYZ);
      
      // Clean up: delete the item
      console.log(`\nAttempting to delete item with ID: ${newItem.id}...`);
      const deleteResult = await deleteItem(newItem.id);
      console.log('Item Deletion Result:', deleteResult);


      // Demonstrate searching manufacturers
      if (manufacturer1 && manufacturer1.id) {
        console.log(`\nAttempting to search for manufacturer with text 'Awesome'...`);
        const searchManuResults = await searchManufacturers('Awesome');
        console.log('Search Manufacturer Results (should find Awesome Inc.):', searchManuResults);

        console.log(`\nAttempting to search for manufacturer with text 'Road'...`);
        const searchManuResultsAddr = await searchManufacturers('Road');
        console.log('Search Manufacturer Results by Address (should find Awesome Inc.):', searchManuResultsAddr);
        
        console.log(`\nAttempting to search for manufacturer with text 'NonExistent'...`);
        const searchManuResultsNonExistent = await searchManufacturers('NonExistent');
        console.log('Search Manufacturer Results (should be empty):', searchManuResultsNonExistent);

        // Clean up: delete the manufacturer
        console.log(`\nAttempting to delete manufacturer with ID: ${manufacturer1.id}...`);
        const deleteManuResult = await deleteManufacturer(manufacturer1.id);
        console.log('Manufacturer Deletion Result:', deleteManuResult);
      }

      console.log(`\nAttempting to read deleted item with ID: ${newItem.id}...`);
      const readAfterDeleteResult = await readItem(newItem.id);
      console.log('Read After Delete Item:', readAfterDeleteResult);
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
