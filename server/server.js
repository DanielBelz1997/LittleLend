const express = require('express');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Configure session
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  }));

  // Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Include the passport config file
require('./passport-config');

// Example protected route
app.get('/admin', isAuthenticated, (req, res) => {
    res.send('Admin interface');
  });

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login'); // Redirect to login page if not authenticated
  }

  app.get('/login', (req, res) => {
    res.send('Login page'); // Implement your login page here
  });
  
  app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/admin',
      failureRedirect: '/login',
      failureFlash: true,
    })
  );
  
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  
// SQLite setup
const db = new sqlite3.Database('mydatabase.db');

db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    category TEXT, -- Category of the item (baby furniture, baby clothes, etc.)
    picture TEXT, -- URL or file path
    name TEXT,
    brand TEXT,
    description TEXT,
    age_range TEXT,
    security_deposit_rate REAL,
    borrow_lend_indicator INTEGER, -- 0 for lend, 1 for borrow (for example)
    listed_date TEXT
  )
`);



db.run(`
  CREATE TABLE IF NOT EXISTS lends (
    id INTEGER PRIMARY KEY,
    item_id INTEGER, -- Foreign key referencing items table
    borrower_name TEXT,
    phone_number TEXT,
    security_deposit_method TEXT,
    lending_date TEXT,
    returning_date TEXT
  )
`);


db.run(`
  CREATE TABLE IF NOT EXISTS borrowers (
    id INTEGER PRIMARY KEY,
    borrower_name TEXT,
    phone_number TEXT,
    is_active INTEGER -- 0 for inactive, 1 for active (for example)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS borrowers_items (
    borrower_id INTEGER, -- Foreign key referencing borrowers table
    item_id INTEGER -- Foreign key referencing items table
  )
`);


// Define routes and middleware here, use GET /api/items to get the data


app.get('/api/items', (req, res) => {
    // Check if the request is coming from an authenticated admin
    if (req.isAuthenticated() && req.user.isAdmin) {
      // Admin view: retrieve all items
      db.all('SELECT * FROM items', (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ items: rows });
      });
    } else {
      // User view: retrieve only available items
      db.all('SELECT * FROM items WHERE is_available = 1', (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ items: rows });
      });
    }
  });
  

  app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ items: rows });
    });
  });

  app.get('/lends', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ lends: rows });
    });
  });
  
  // Add more routes and database operations as needed

  app.get('/home', (req, res) => {
    // Handle requests to the /home route
  });

  app.use((err, req, res, next) => {
    // Handle errors here
  });

  
  
  app.get('/search', (req, res) => {
    const { searchTerm } = req.query;
  
    // Check if the request is coming from an authenticated admin
    if (req.isAuthenticated() && req.user.isAdmin) {
      // Admin view: search all items
      const query = `
        SELECT * FROM items
        WHERE name LIKE ? OR description LIKE ? OR brand LIKE ? OR age_range LIKE ?;
      `;
      const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
      
      db.all(query, params, (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ items: rows });
      });
    } else {
      // User view: search only available items
      const query = `
        SELECT * FROM items
        WHERE is_available = 1
        AND (name LIKE ? OR description LIKE ? OR brand LIKE ? OR age_range LIKE ?);
      `;
      const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
      
      db.all(query, params, (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ items: rows });
      });
    }
  });
  
  

  // Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });