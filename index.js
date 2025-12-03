require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем запросы с любых устройств (для мобильного приложения)
app.use(cors());
app.use(express.json());

// Подключаемся к твоей базе данных на Render
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- НАШИ "ДВЕРИ" (ЭНДПОИНТЫ) ---

// 1. Проверка: Жив ли сервер?
app.get('/', (req, res) => {
    res.json({ message: "One Mart API работает! 🚀" });
});

// 2. Получить список всех магазинов
// Приложение обратится сюда, чтобы показать карту или список магазинов
app.get('/stores', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, name, address, latitude, longitude FROM stores');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения магазинов" });
    }
});

// 3. Получить товары конкретного магазина
// Приложение отправит ID магазина (например, 1), а мы вернем его товары
app.get('/products/:storeId', async (req, res) => {
    const { storeId } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT id, name_uz, name_ru, price, photo_url, category_id 
             FROM products 
             WHERE store_id = $1 
             ORDER BY name_uz ASC`, 
            [storeId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения товаров" });
    }
});

// 4. Получить список категорий
app.get('/categories', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения категорий" });
    }
});

// Запуск
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});