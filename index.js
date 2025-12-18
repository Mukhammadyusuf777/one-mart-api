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

// --- 1. КЛИЕНТ: Поиск товаров ---
app.get('/products/all', async (req, res) => {
    const { q, category } = req.query; 
    try {
        let query = `
            SELECT p.id, p.name_uz, p.price, p.photo_url, p.category, s.name as store_name
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE 1=1 
        `;
        let params = [];
        let i = 1;

        if (q && q.trim() !== '') {
            query += ` AND (p.name_uz ILIKE $${i})`;
            params.push(`%${q}%`);
            i++;
        }
        if (category && category !== 'Barchasi') {
            query += ` AND p.category = $${i}`;
            params.push(category);
            i++;
        }
        query += ' ORDER BY p.id DESC';
        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 2. КЛИЕНТ: Создание заказа ---
app.post('/orders', async (req, res) => {
    const client = await db.connect();
    try {
        const { user_name, user_phone, user_address, total_price, delivery_price, items } = req.body;
        await client.query('BEGIN');

        const orderRes = await client.query(
            `INSERT INTO orders (user_name, user_phone, user_address, total_price, delivery_price) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [user_name, user_phone, user_address, total_price, delivery_price]
        );
        const orderId = orderRes.rows[0].id;

        for (let item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.id, item.name, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, orderId });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally { client.release(); }
});

// --- 3. ПРОДАВЕЦ: Получить список заказов ---
app.get('/admin/orders', async (req, res) => {
    try {
        // Получаем заказы и сортируем: сначала новые
        const ordersRes = await db.query(`
            SELECT * FROM orders ORDER BY id DESC LIMIT 50
        `);
        const orders = ordersRes.rows;

        // Для каждого заказа подгружаем список товаров
        for (let order of orders) {
            const itemsRes = await db.query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
            order.items = itemsRes.rows;
        }

        res.json(orders);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 4. ПРОДАВЕЦ: Изменить статус заказа (Принять/Завершить) ---
app.patch('/admin/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'accepted', 'done', 'canceled'

    try {
        await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/stores', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM stores');
    res.json(rows);
});

app.listen(PORT, () => {
    console.log(`✅ Server running on ${PORT}`);
});
// --- 5. КЛИЕНТ: История заказов пользователя ---
app.get('/orders/user/:phone', async (req, res) => {
    const { phone } = req.params;
    try {
        // Ищем заказы по номеру телефона (сначала свежие)
        const ordersRes = await db.query(`
            SELECT * FROM orders 
            WHERE user_phone = $1 
            ORDER BY id DESC
        `, [phone]);
        
        const orders = ordersRes.rows;

        // Подгружаем товары для каждого заказа
        for (let order of orders) {
            const itemsRes = await db.query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
            order.items = itemsRes.rows;
        }

        res.json(orders);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Xatolik" });
    }
});
