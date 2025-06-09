import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const DEFAULT_PORT = process.env.PORT || 3001;

// Enhanced CORS configuration for WebContainer
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Remove CSP headers that might interfere
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure server directory exists
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

// Database setup
const dbPath = join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

let db;

try {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database');
    }
  });
} catch (error) {
  console.error('Failed to create database connection:', error);
  process.exit(1);
}

// Initialize database tables
db.serialize(() => {
  // Cargo table
  db.run(`
    CREATE TABLE IF NOT EXISTS cargo (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      length REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      volume REAL NOT NULL,
      weight REAL NOT NULL,
      notes TEXT,
      date TEXT NOT NULL,
      cargoType TEXT NOT NULL,
      category TEXT NOT NULL,
      urgent BOOLEAN NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'warehouse',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating cargo table:', err);
    } else {
      console.log('Cargo table ready');
    }
  });

  // Trucks table
  db.run(`
    CREATE TABLE IF NOT EXISTS trucks (
      id TEXT PRIMARY KEY,
      truck_type TEXT NOT NULL,
      loading_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating trucks table:', err);
    } else {
      console.log('Trucks table ready');
    }
  });

  // Truck cargo relationship table
  db.run(`
    CREATE TABLE IF NOT EXISTS truck_cargo (
      truck_id TEXT,
      cargo_id TEXT,
      PRIMARY KEY (truck_id, cargo_id),
      FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE,
      FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating truck_cargo table:', err);
    } else {
      console.log('Truck_cargo table ready');
    }
  });
});

// Helper function to promisify database operations
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Enhanced database transaction with better error handling
const dbTransaction = (operations) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    console.log('🔄 Starting database transaction with', operations.length, 'operations');

    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('❌ Failed to begin transaction:', err);
          reject(err);
          return;
        }

        console.log('✅ Transaction started');

        const executeOperations = async () => {
          try {
            const results = [];
            for (let i = 0; i < operations.length; i++) {
              const op = operations[i];
              console.log(`🔄 Executing operation ${i + 1}/${operations.length}: ${op.sql.substring(0, 50)}...`);
              const result = await dbRun(op.sql, op.params);
              results.push(result);
              console.log(`✅ Operation ${i + 1} completed, changes: ${result.changes}`);
            }
            return results;
          } catch (error) {
            console.error('❌ Operation failed:', error);
            throw error;
          }
        };

        executeOperations()
          .then((results) => {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('❌ Failed to commit transaction:', commitErr);
                reject(commitErr);
              } else {
                console.log('✅ Transaction committed successfully');
                resolve(results);
              }
            });
          })
          .catch((error) => {
            console.error('❌ Transaction operation failed:', error);
            db.run('ROLLBACK', (rollbackErr) => {
              if (rollbackErr) {
                console.error('❌ Failed to rollback transaction:', rollbackErr);
              } else {
                console.log('🔄 Transaction rolled back');
              }
              reject(error);
            });
          });
      });
    });
  });
};

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Get all cargo items
app.get('/api/cargo', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM cargo';
    let params = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const cargo = await dbAll(sql, params);
    res.json(cargo);
  } catch (error) {
    console.error('Error fetching cargo:', error);
    res.status(500).json({ error: 'Failed to fetch cargo' });
  }
});

// Create new cargo
app.post('/api/cargo', async (req, res) => {
  try {
    const {
      id,
      name,
      manufacturer,
      quantity,
      length,
      width,
      height,
      volume,
      weight,
      notes,
      date,
      cargoType,
      category,
      urgent
    } = req.body;

    await dbRun(`
      INSERT INTO cargo (
        id, name, manufacturer, quantity, length, width, height, volume,
        weight, notes, date, cargoType, category, urgent, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'warehouse')
    `, [
      id, name, manufacturer, quantity, length, width, height, volume,
      weight, notes, date, cargoType, category, urgent ? 1 : 0
    ]);

    const newCargo = await dbGet('SELECT * FROM cargo WHERE id = ?', [id]);
    res.status(201).json(newCargo);
  } catch (error) {
    console.error('Error creating cargo:', error);
    res.status(500).json({ error: 'Failed to create cargo' });
  }
});

// Enhanced clear warehouse endpoint with detailed logging - MOVED BEFORE :id route
app.delete('/api/cargo/clear-warehouse', async (req, res) => {
  console.log('🗑️ === WAREHOUSE CLEAR OPERATION STARTED ===');
  
  try {
    // Check if database is available
    if (!db) {
      console.error('❌ Database not available');
      return res.status(500).json({ 
        error: 'Database not available',
        details: 'Database connection is not initialized'
      });
    }

    // Check current warehouse items count
    console.log('📊 Checking current warehouse items...');
    const warehouseCount = await dbGet('SELECT COUNT(*) as count FROM cargo WHERE status = ?', ['warehouse']);
    console.log(`📦 Found ${warehouseCount.count} warehouse items to clear`);

    if (warehouseCount.count === 0) {
      console.log('✅ Warehouse is already empty');
      return res.json({ 
        message: 'Warehouse is already empty', 
        timestamp: new Date().toISOString(),
        itemsCleared: 0
      });
    }

    // Get list of items to be cleared for logging
    const itemsToDelete = await dbAll('SELECT id, name, manufacturer FROM cargo WHERE status = ?', ['warehouse']);
    console.log('📋 Items to be cleared:', itemsToDelete.map(item => `${item.id}: ${item.name} - ${item.manufacturer}`));

    // Use transaction to ensure data consistency
    const operations = [
      { 
        sql: 'DELETE FROM truck_cargo WHERE cargo_id IN (SELECT id FROM cargo WHERE status = ?)', 
        params: ['warehouse'] 
      },
      { 
        sql: 'DELETE FROM cargo WHERE status = ?', 
        params: ['warehouse'] 
      }
    ];

    console.log('🔄 Executing database transaction...');
    const results = await dbTransaction(operations);
    
    console.log('📊 Transaction results:', results);
    
    // Verify the operation
    const remainingCount = await dbGet('SELECT COUNT(*) as count FROM cargo WHERE status = ?', ['warehouse']);
    console.log(`✅ Warehouse cleared successfully. Remaining items: ${remainingCount.count}`);
    
    const response = { 
      message: 'Warehouse cleared successfully', 
      timestamp: new Date().toISOString(),
      itemsCleared: warehouseCount.count,
      remainingItems: remainingCount.count,
      operationResults: results
    };
    
    console.log('📤 Sending response:', response);
    console.log('🗑️ === WAREHOUSE CLEAR OPERATION COMPLETED ===');
    
    res.json(response);
  } catch (error) {
    console.error('❌ === WAREHOUSE CLEAR OPERATION FAILED ===');
    console.error('❌ Error details:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Provide detailed error information
    let errorMessage = 'Failed to clear warehouse';
    let errorDetails = error.message;
    
    if (error.code === 'SQLITE_BUSY') {
      errorMessage = 'Database is busy, please try again';
      errorDetails = 'Another operation is currently using the database';
    } else if (error.code === 'SQLITE_LOCKED') {
      errorMessage = 'Database is locked, please try again';
      errorDetails = 'Database is locked by another process';
    }
    
    const errorResponse = { 
      error: errorMessage,
      details: errorDetails,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Clear all shipped cargo - MOVED BEFORE :id route
app.delete('/api/cargo/clear-shipped', async (req, res) => {
  try {
    console.log('🗑️ Starting shipped cargo clear operation...');
    
    if (!db) {
      console.error('❌ Database not available');
      return res.status(500).json({ 
        error: 'Database not available',
        details: 'Database connection is not initialized'
      });
    }

    const shippedCount = await dbGet('SELECT COUNT(*) as count FROM cargo WHERE status = ?', ['shipped']);
    console.log(`📦 Found ${shippedCount.count} shipped items to clear`);

    if (shippedCount.count === 0) {
      console.log('✅ No shipped items to clear');
      return res.json({ 
        message: 'No shipped items to clear', 
        timestamp: new Date().toISOString(),
        itemsCleared: 0
      });
    }

    const operations = [
      { 
        sql: 'DELETE FROM truck_cargo WHERE cargo_id IN (SELECT id FROM cargo WHERE status = ?)', 
        params: ['shipped'] 
      },
      { 
        sql: 'DELETE FROM cargo WHERE status = ?', 
        params: ['shipped'] 
      }
    ];

    console.log('🔄 Executing database transaction...');
    await dbTransaction(operations);
    
    const remainingCount = await dbGet('SELECT COUNT(*) as count FROM cargo WHERE status = ?', ['shipped']);
    console.log(`✅ Shipped cargo cleared successfully. Remaining items: ${remainingCount.count}`);
    
    res.json({ 
      message: 'Shipped cargo cleared successfully', 
      timestamp: new Date().toISOString(),
      itemsCleared: shippedCount.count,
      remainingItems: remainingCount.count
    });
  } catch (error) {
    console.error('❌ Error clearing shipped cargo:', error);
    res.status(500).json({ 
      error: 'Failed to clear shipped cargo',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Get cargo by ID - MOVED AFTER specific routes
app.get('/api/cargo/:id', async (req, res) => {
  try {
    const cargo = await dbGet('SELECT * FROM cargo WHERE id = ?', [req.params.id]);
    if (!cargo) {
      return res.status(404).json({ error: 'Cargo not found' });
    }
    res.json(cargo);
  } catch (error) {
    console.error('Error fetching cargo:', error);
    res.status(500).json({ error: 'Failed to fetch cargo' });
  }
});

// Update cargo status (ship cargo)
app.patch('/api/cargo/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    await dbRun(
      'UPDATE cargo SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    const updatedCargo = await dbGet('SELECT * FROM cargo WHERE id = ?', [id]);
    res.json(updatedCargo);
  } catch (error) {
    console.error('Error updating cargo status:', error);
    res.status(500).json({ error: 'Failed to update cargo status' });
  }
});

// Delete cargo - MOVED AFTER specific routes
app.delete('/api/cargo/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM cargo WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cargo not found' });
    }
    res.json({ message: 'Cargo deleted successfully' });
  } catch (error) {
    console.error('Error deleting cargo:', error);
    res.status(500).json({ error: 'Failed to delete cargo' });
  }
});

// Get all trucks with their cargo
app.get('/api/trucks', async (req, res) => {
  try {
    const trucks = await dbAll('SELECT * FROM trucks ORDER BY created_at DESC');
    
    // Get cargo for each truck
    for (let truck of trucks) {
      const cargo = await dbAll(`
        SELECT c.* FROM cargo c
        JOIN truck_cargo tc ON c.id = tc.cargo_id
        WHERE tc.truck_id = ?
      `, [truck.id]);
      truck.cargos = cargo;
    }
    
    res.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
});

// Clear all truck records
app.delete('/api/trucks/clear-all', async (req, res) => {
  try {
    console.log('🗑️ Starting truck records clear operation...');
    
    if (!db) {
      console.error('❌ Database not available');
      return res.status(500).json({ 
        error: 'Database not available',
        details: 'Database connection is not initialized'
      });
    }

    const truckCount = await dbGet('SELECT COUNT(*) as count FROM trucks');
    console.log(`🚛 Found ${truckCount.count} truck records to clear`);

    if (truckCount.count === 0) {
      console.log('✅ No truck records to clear');
      return res.json({ 
        message: 'No truck records to clear', 
        timestamp: new Date().toISOString(),
        trucksCleared: 0
      });
    }

    const operations = [
      { sql: 'DELETE FROM truck_cargo', params: [] },
      { sql: 'DELETE FROM trucks', params: [] },
      { sql: 'UPDATE cargo SET status = ? WHERE status = ?', params: ['warehouse', 'shipped'] }
    ];

    console.log('🔄 Executing database transaction...');
    await dbTransaction(operations);
    
    const remainingTrucks = await dbGet('SELECT COUNT(*) as count FROM trucks');
    console.log(`✅ All truck records cleared successfully. Remaining trucks: ${remainingTrucks.count}`);
    
    res.json({ 
      message: 'All truck records cleared successfully', 
      timestamp: new Date().toISOString(),
      trucksCleared: truckCount.count,
      remainingTrucks: remainingTrucks.count
    });
  } catch (error) {
    console.error('❌ Error clearing truck records:', error);
    res.status(500).json({ 
      error: 'Failed to clear truck records',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Create truck and load cargo
app.post('/api/trucks/load', async (req, res) => {
  try {
    const { cargoIds } = req.body;
    
    if (!cargoIds || cargoIds.length === 0) {
      return res.status(400).json({ error: 'No cargo IDs provided' });
    }

    // Get cargo details for optimization
    const cargoList = await dbAll(`
      SELECT * FROM cargo WHERE id IN (${cargoIds.map(() => '?').join(',')}) AND status = 'warehouse'
    `, cargoIds);

    if (cargoList.length === 0) {
      return res.status(400).json({ error: 'No valid cargo found' });
    }

    // Truck types configuration
    const TRUCK_TYPES = [
      { 
        name: '轻型货车', 
        length: 2.7,
        width: 1.5,
        height: 1.4,
        maxWeight: 1.5
      },
      { 
        name: '中型货车', 
        length: 4.2,
        width: 2.0,
        height: 1.8,
        maxWeight: 5
      },
      { 
        name: '重型货车', 
        length: 7.6,
        width: 2.3,
        height: 2.4,
        maxWeight: 15
      }
    ];

    // Simple bin packing algorithm
    const optimizeLoading = (cargos, truckTypes) => {
      const trucks = [];
      let remainingCargos = [...cargos].sort((a, b) => b.volume - a.volume);

      while (remainingCargos.length > 0) {
        let bestTruck = null;
        let bestCargos = [];

        // Try each truck type
        for (const truckType of truckTypes) {
          const truckCargos = [];
          let currentWeight = 0;
          let currentVolume = 0;
          const maxVolume = truckType.length * truckType.width * truckType.height;

          for (const cargo of remainingCargos) {
            if (currentWeight + cargo.weight <= truckType.maxWeight &&
                currentVolume + cargo.volume <= maxVolume) {
              truckCargos.push(cargo);
              currentWeight += cargo.weight;
              currentVolume += cargo.volume;
            }
          }

          if (truckCargos.length > bestCargos.length) {
            bestTruck = truckType;
            bestCargos = truckCargos;
          }
        }

        if (bestTruck && bestCargos.length > 0) {
          trucks.push({
            truckType: bestTruck,
            cargos: bestCargos
          });
          remainingCargos = remainingCargos.filter(cargo => 
            !bestCargos.some(bc => bc.id === cargo.id)
          );
        } else {
          // If no truck can fit any cargo, use the largest truck for the first item
          const largestTruck = TRUCK_TYPES[TRUCK_TYPES.length - 1];
          trucks.push({
            truckType: largestTruck,
            cargos: [remainingCargos[0]]
          });
          remainingCargos = remainingCargos.slice(1);
        }
      }

      return trucks;
    };

    const optimizedTrucks = optimizeLoading(cargoList, TRUCK_TYPES);
    const loadingDate = new Date().toISOString().split('T')[0];
    const createdTrucks = [];

    // Create trucks and load cargo using transaction
    for (let i = 0; i < optimizedTrucks.length; i++) {
      const truckData = optimizedTrucks[i];
      const truckId = `truck-${Date.now()}-${i}`;

      const operations = [
        // Create truck
        { 
          sql: 'INSERT INTO trucks (id, truck_type, loading_date) VALUES (?, ?, ?)', 
          params: [truckId, JSON.stringify(truckData.truckType), loadingDate] 
        },
        // Link cargo to truck and update status
        ...truckData.cargos.flatMap(cargo => [
          { 
            sql: 'INSERT INTO truck_cargo (truck_id, cargo_id) VALUES (?, ?)', 
            params: [truckId, cargo.id] 
          },
          { 
            sql: 'UPDATE cargo SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            params: ['shipped', cargo.id] 
          }
        ])
      ];

      await dbTransaction(operations);

      createdTrucks.push({
        id: truckId,
        truck_type: JSON.stringify(truckData.truckType),
        loading_date: loadingDate,
        cargos: truckData.cargos
      });
    }

    res.json(createdTrucks);
  } catch (error) {
    console.error('Error loading cargo to trucks:', error);
    res.status(500).json({ 
      error: 'Failed to load cargo to trucks',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Function to find an available port
const findAvailablePort = (startPort, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    const tryPort = () => {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find an available port after ${maxAttempts} attempts`));
        return;
      }

      const server = createServer();
      
      server.listen(currentPort, '0.0.0.0', () => {
        server.close(() => {
          resolve(currentPort);
        });
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${currentPort} is in use, trying port ${currentPort + 1}...`);
          currentPort++;
          attempts++;
          tryPort();
        } else {
          reject(err);
        }
      });
    };

    tryPort();
  });
};

// Start server with dynamic port selection
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(DEFAULT_PORT);
    
    const server = app.listen(availablePort, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${availablePort}`);
      console.log(`🌐 API available at http://localhost:${availablePort}/api`);
      console.log(`🔍 Health check: http://localhost:${availablePort}/api/health`);
      
      if (availablePort !== DEFAULT_PORT) {
        console.log(`⚠️  Note: Using port ${availablePort} instead of ${DEFAULT_PORT} (port was in use)`);
      }
    });

    // Handle server startup errors
    server.on('error', (err) => {
      console.error('❌ Server startup error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${availablePort} is already in use. This should not happen with dynamic port selection.`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🔄 Shutting down server...');
      server.close(() => {
        console.log('🔌 HTTP server closed');
        if (db) {
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err);
            } else {
              console.log('🗄️ Database connection closed');
            }
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();