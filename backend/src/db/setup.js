const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'sahoo@9832',
    port: process.env.DB_PORT || 5432,
};

async function setupDatabase() {
    // 1. Create Database if not exists
    const adminClient = new Client({
        ...dbConfig,
        database: 'postgres' // Connect to default
    });

    try {
        await adminClient.connect();
        const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'twin'");
        if (res.rowCount === 0) {
            console.log("Database 'twin' not found. Creating...");
            await adminClient.query('CREATE DATABASE twin');
            console.log("Database 'twin' created.");
        } else {
            console.log("Database 'twin' already exists.");
        }
    } catch (err) {
        console.error("Error creating database:", err);
    } finally {
        await adminClient.end();
    }

    // 2. Run Schema in 'twin'
    const client = new Client({
        ...dbConfig,
        database: 'twin'
    });

    try {
        await client.connect();
        
        // Try creating extension separately to catch specific error
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS vector');
            console.log("pgvector extension enabled.");
        } catch (e) {
            console.warn("Could not enable pgvector extension. Fallback to float8[] might be needed in schema.");
            // We might need to adjust schema on the fly if this fails, but for now let's see.
        }

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split queries by semicolon to run them specifically? 
        // Postgres client can often handle multiple commands, but sometimes specific errors break the chain.
        // But for schema.sql it's usually fine.
        
        await client.query(schema);
        console.log("Schema applied successfully.");

    } catch (err) {
        console.error("Error applying schema:", err);
    } finally {
        await client.end();
    }
}

setupDatabase();
