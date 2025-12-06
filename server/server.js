const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('./ScriptDB.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    }
    else {
        console.log('Connected to SQLite database');

        // Create scriptinfodb table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS scriptinfodb (
                ID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
                Entry_No INTEGER NOT NULL,
                Name TEXT NOT NULL,
                Type TEXT NOT NULL,
                Line INTEGER,
                Note TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Could not create scriptinfodb table', err);
            } else {
                console.log('scriptinfodb table is ready');
            }
                });
            }
        });

        // REST API Endpoints

        // Get all scripts
        app.get('/scripts', (req, res) => {
            db.all('SELECT * FROM scriptinfodb', [], (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.json(rows);
                }
            });
        });

        // Get a single script by ID
        app.get('/scripts/:id', (req, res) => {
            const id = req.params.id;
            db.get('SELECT * FROM scriptinfodb WHERE ID = ?', [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else if (!row) {
                    res.status(404).json({ error: 'Not found' });
                } else {
                    res.json(row);
                }
            });
        });

        // Create a new script
        app.post('/scripts', (req, res) => {
            const { Entry_No, Name, Type, Line, Note } = req.body;
            if (!Entry_No || !Name || !Type) {
                return res.status(400).json({ error: 'Entry_No, Name, and Type are required' });
            }
            db.run(
                'INSERT INTO scriptinfodb (Entry_No, Name, Type, Line, Note) VALUES (?, ?, ?, ?, ?)',
                [Entry_No, Name, Type, Line || null, Note || null],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.status(201).json({ ID: this.lastID });
                    }
                }
            );
        });

        // Update a script by ID
        app.put('/scripts/:id', (req, res) => {
            const id = req.params.id;
            const { Entry_No, Name, Type, Line, Note } = req.body;
            db.run(
                'UPDATE scriptinfodb SET Entry_No = ?, Name = ?, Type = ?, Line = ?, Note = ? WHERE ID = ?',
                [Entry_No, Name, Type, Line || null, Note || null, id],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else if (this.changes === 0) {
                        res.status(404).json({ error: 'Not found' });
                    } else {
                        res.json({ updated: this.changes });
                    }
                }
            );
        });

        // Delete a script by ID
        app.delete('/scripts/:id', (req, res) => {
            const id = req.params.id;
            db.run('DELETE FROM scriptinfodb WHERE ID = ?', [id], function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else if (this.changes === 0) {
                    res.status(404).json({ error: 'Not found' });
                } else {
                    res.json({ deleted: this.changes });
                }
            });
        });

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
