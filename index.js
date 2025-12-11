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

// --- ГЛАВНЫЙ ПОИСК ТОВАРОВ ---
app.get('/products/all', async (req, res) => {
    // Получаем параметры от приложения:
    // q = текст поиска (например, "cola")
    // category = категория (например, "Ichimliklar")
    const { q, category } = req.query; 

    try {
        let query = `
            SELECT p.id, p.name_uz, p.name_ru, p.price, p.photo_url, 
                   s.name as store_name
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE 1=1 
        `;
        
        let params = [];
        let paramIndex = 1;

        // 1. Ели есть ПОИСК (q)
        if (q && q.trim() !== '') {
            query += ` AND (p.name_uz ILIKE $${paramIndex} OR p.name_ru ILIKE $${paramIndex})`;
            params.push(`%${q}%`);
            paramIndex++;
        }

        // 2. Если есть КАТЕГОРИЯ
        // (Так как у нас в базе нет колонки category_id, мы хитрим и ищем по словам)
        if (category && category !== 'Barchasi') {
            if (category === 'Ichimliklar') {
                query += ` AND (p.name_uz ILIKE '%cola%' OR p.name_uz ILIKE '%suv%' OR p.name_uz ILIKE '%fanta%' OR p.name_uz ILIKE '%litr%')`;
            } else if (category === 'Oziq-ovqat') {
                query += ` AND (p.name_uz ILIKE '%yog%' OR p.name_uz ILIKE '%guruch%' OR p.name_uz ILIKE '%un%' OR p.name_uz ILIKE '%shakar%')`;
            } else if (category === 'Shirinliklar') {
                query += ` AND (p.name_uz ILIKE '%shokolad%' OR p.name_uz ILIKE '%pechenye%' OR p.name_uz ILIKE '%tort%')`;
            }
            // В реальном проекте мы бы добавили колонку category_id в базу данных
        }

        query += ' ORDER BY p.id DESC LIMIT 50';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Xatolik" });
    }
});

app.get('/stores', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM stores');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Xatolik" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
