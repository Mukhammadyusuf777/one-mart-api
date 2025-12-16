require('dotenv').config();
const { Client } = require('pg'); // <--- ИСПОЛЬЗУЕМ CLIENT ВМЕСТО POOL

// Создаем клиента (прямое соединение)
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createOrdersTable() {
    try {
        console.log('🔌 Подключаемся к базе данных...');
        await client.connect(); // Явное подключение

        console.log('📦 Создаем таблицы для заказов...');

        // 1. Таблица ЗАКАЗОВ
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_name VARCHAR(100),
                user_phone VARCHAR(50),
                user_address TEXT,
                total_price INTEGER,
                delivery_price INTEGER,
                status VARCHAR(20) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Таблица ТОВАРОВ В ЗАКАЗЕ
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

        console.log('✅ Таблицы заказов успешно созданы!');

    } catch (e) {
        console.error('❌ Ошибка при создании таблиц:', e);
    } finally {
        await client.end(); // Обязательно закрываем соединение
        console.log('🔌 Соединение закрыто.');
    }
}

createOrdersTable();
