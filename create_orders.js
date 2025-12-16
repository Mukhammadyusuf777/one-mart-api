require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createOrdersTable() {
    const client = await db.connect();
    try {
        console.log('📦 Создаем таблицы для заказов...');

        // 1. Таблица САМИХ ЗАКАЗОВ (Чек)
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_name VARCHAR(100),
                user_phone VARCHAR(50),
                user_address TEXT,
                total_price INTEGER,
                delivery_price INTEGER,
                status VARCHAR(20) DEFAULT 'new', -- new (yangi), accepted (qabul), done (tugadi)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Таблица ТОВАРОВ ВНУТРИ ЗАКАЗА (Детали)
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                product_id INTEGER,
                product_name VARCHAR(255),
                quantity INTEGER,
                price INTEGER
            );
        `);

        console.log('✅ Таблицы заказов готовы! Теперь можно продавать.');

    } catch (e) {
        console.error('❌ Ошибка:', e);
    } finally {
        client.release();
        db.end();
    }
}

createOrdersTable();
