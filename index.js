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

// --- ГЛАВНЫЕ ЭНДПОИНТЫ ---

// 1. Получить ВСЕ товары (Витрина) + Фильтр по категории
app.get('/products/all', async (req, res) => {
    const { category } = req.query; // Получаем категорию, если есть
    try {
        let query = `
            SELECT p.id, p.name_uz, p.name_ru, p.price, p.photo_url, p.store_id, 
                   s.name as store_name, s.latitude, s.longitude
            FROM products p
            JOIN stores s ON p.store_id = s.id
        `;
        
        let params = [];
        
        // Если клиент нажал на категорию
        if (category && category !== 'Barchasi') {
            // Здесь простая логика: ищем совпадение в названии категории (в реальном проекте лучше по ID)
            // Для примера просто вернем все, но в будущем тут будет WHERE category_id = ...
        }

        // Перемешиваем товары, чтобы было интересно (как в ТикТоке/Узум)
        query += ' ORDER BY RANDOM() LIMIT 50';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Xatolik" });
    }
});

// 2. Получить список магазинов (для расчета расстояния)
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
