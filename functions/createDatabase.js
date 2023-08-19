const sqlite3 = require('sqlite3').verbose()


const db = new sqlite3.Database('./database/binFutures.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message)
    } else {
        console.log('Connected to the database.')
        createTables()
    }
})


function createTables() {
    db.serialize(() => {
      // Create TR signals table
      db.run(`
        CREATE TABLE IF NOT EXISTS tr_signals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          exchange TEXT,
          pair TEXT,
          timeframe TEXT,
          indicator TEXT,
          value REAL,
          datetime TEXT
        )
      `);
  
      // Create MA signals table
      db.run(`
        CREATE TABLE IF NOT EXISTS ma_signals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          exchange TEXT,
          pair TEXT,
          timeframe TEXT,
          indicator TEXT,
          value REAL,
          datetime TEXT
        )
      `);
  
      // Create SI signals table
      db.run(`
        CREATE TABLE IF NOT EXISTS si_signals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          exchange TEXT,
          pair TEXT,
          timeframe TEXT,
          indicator TEXT,
          value TEXT,
          datetime TEXT
        )
      `);
  
      // Create open positions table
      db.run(`
        CREATE TABLE IF NOT EXISTS open_positions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          datetime TEXT,
          exchange TEXT,
          pair TEXT,
          direction TEXT,
          timeframe TEXT,
          entry_price REAL,
          stop_loss REAL,
          take_profit REAL,
          leverage TEXT,
          status TEXT
        )
      `);
  
      // Create closed positions table
      db.run(`
        CREATE TABLE IF NOT EXISTS closed_positions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          datetime TEXT,
          exchange TEXT,
          pair TEXT,
          direction TEXT,
          timeframe TEXT,
          entry_price REAL,
          exit_price REAL,
          leverage TEXT,
          exit_reason TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err.message);
        } else {
          console.log('Tables created successfully.');
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('Database connection closed.');
            }
          });
        }
      });
    });
  }
  