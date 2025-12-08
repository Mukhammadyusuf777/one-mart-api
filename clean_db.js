require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanDatabase() {
    const client = await db.connect();
    try {
        console.log('🧹 Начинаем уборку базы данных...');

        // 1. Удаление дубликатов
        // Эта сложная команда оставляет только товар с самым высоким ID (самый свежий), 
        // а старые копии с таким же именем удаляет.
        const query = `
            DELETE FROM products a USING products b
            WHERE a.id < b.id 
            AND a.name_uz = b.name_uz 
            AND a.store_id = b.store_id;
        `;

        const res = await client.query(query);
        console.log(`✅ УДАЛЕНО ДУБЛИКАТОВ: ${res.rowCount} штук.`);

        // 2. Проверка, сколько осталось
        const countRes = await client.query('SELECT count(*) FROM products');
        console.log(`📊 Всего товаров осталось: ${countRes.rows[0].count}`);

    } catch (e) {
        console.error('❌ Ошибка:', e);
    } finally {
        client.release();
        db.end();
    }
}

cleanDatabase();
