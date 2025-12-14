require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetDatabase() {
    const client = await db.connect();
    try {
        console.log('🗑 Удаляем старые данные...');
        
        // Удаляем таблицу товаров и создаем заново с ПРАВИЛЬНЫМИ колонками
        await client.query(`DROP TABLE IF EXISTS products`);
        await client.query(`
            CREATE TABLE products (
                id SERIAL PRIMARY KEY,
                name_uz VARCHAR(255),
                name_ru VARCHAR(255),
                price INTEGER,
                photo_url TEXT,
                store_id INTEGER,
                category VARCHAR(50) -- <--- ВОТ ОНА, НОВАЯ КОЛОНКА!
            );
        `);

        console.log('✅ Таблицы созданы. Добавляем правильные товары...');

        // Список идеальных товаров для старта
        const products = [
            // НАПИТКИ (Ichimliklar)
            { name: "Coca-Cola 1.5L", price: 12000, cat: "Ichimliklar", img: "https://images.uzum.uz/cfeb04avtie1lhbhfr10/original.jpg" },
            { name: "Fanta 1.5L", price: 12000, cat: "Ichimliklar", img: "https://images.uzum.uz/cfeb10740v9556641660/original.jpg" },
            { name: "Nestle Suv 5L", price: 15000, cat: "Ichimliklar", img: "https://images.uzum.uz/cj9cnfcvtie1lhbgt240/original.jpg" },
            { name: "Pepsi 0.5L", price: 6000, cat: "Ichimliklar", img: "https://images.uzum.uz/ck584cjk9fq1 var690g0/original.jpg" },
            
            // ПРОДУКТЫ (Oziq-ovqat)
            { name: "Kungaboqar yog'i 1L", price: 18000, cat: "Oziq-ovqat", img: "https://images.uzum.uz/cj9d3ckvtie1lhbgt7gg/original.jpg" },
            { name: "Makaron Makfa 400g", price: 9000, cat: "Oziq-ovqat", img: "https://images.uzum.uz/ckf5sjkjvf2q0836q7ng/original.jpg" },
            { name: "Guruch Lazer 1kg", price: 22000, cat: "Oziq-ovqat", img: "https://images.uzum.uz/cc051vb40v955664ecg0/original.jpg" },
            { name: "Tuxum (10 dona)", price: 14000, cat: "Oziq-ovqat", img: "https://images.uzum.uz/ck2p2c4jvf2q0832m1ng/original.jpg" },

            // СЛАДОСТИ (Shirinliklar)
            { name: "Alpen Gold Shokolad", price: 11000, cat: "Shirinliklar", img: "https://images.uzum.uz/cip9hfr40v955663q9og/original.jpg" },
            { name: "Choco Pie (6 dona)", price: 18000, cat: "Shirinliklar", img: "https://images.uzum.uz/cj4r5ckvtie1lhbgi8mg/original.jpg" },
            { name: "Jubileyne Pechenye", price: 7000, cat: "Shirinliklar", img: "https://images.uzum.uz/cj9d85kvtie1lhbgt7og/original.jpg" },

            // ТЕХНИКА (Elektronika) - добавим для красоты
            { name: "iPhone 15 Pro Max", price: 16000000, cat: "Elektronika", img: "https://images.uzum.uz/clkgl4fn7c6qm23k1eug/original.jpg" },
            { name: "Samsung Galaxy A54", price: 4500000, cat: "Elektronika", img: "https://images.uzum.uz/cjra3ckjvf2q0834h2mg/original.jpg" }
        ];

        for (let p of products) {
            await client.query(
                `INSERT INTO products (name_uz, name_ru, price, photo_url, store_id, category) VALUES ($1, $1, $2, $3, 1, $4)`,
                [p.name, p.price, p.img, p.cat]
            );
        }

        console.log(`🎉 Успешно добавлено ${products.length} правильных товаров!`);

    } catch (e) {
        console.error('❌ Ошибка:', e);
    } finally {
        client.release();
        db.end();
    }
}

resetDatabase();
