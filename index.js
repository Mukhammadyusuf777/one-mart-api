require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ГЛАВНЫЙ ПОИСК И ФИЛЬТР
app.get('/products/all', async (req, res) => {
    const { q, category } = req.query; 

    try {
        let query = `
            SELECT p.id, p.name_uz, p.price, p.photo_url, p.category, 
                   s.name as store_name
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE 1=1 
        `;
        
        let params = [];
        let paramIndex = 1;

        // 1. Поиск по тексту (если написали "cola")
        if (q && q.trim() !== '') {
            query += ` AND (p.name_uz ILIKE $${paramIndex})`;
            params.push(`%${q}%`);
            paramIndex++;
        }

        // 2. Фильтр по категории (СТРОГОЕ СОВПАДЕНИЕ)
        if (category && category !== 'Barchasi') {
            query += ` AND p.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        query += ' ORDER BY p.id DESC';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Xatolik" });
    }
});

// Список магазинов
app.get('/stores', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM stores');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Xatolik" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
