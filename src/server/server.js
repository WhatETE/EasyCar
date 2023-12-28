const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;
const saltRounds = 10;
const secretKey = 'XXXXXX';


const db = mysql.createConnection({ // 数据库连接
    host: process.argv[2] || 'localhost',
    user: 'root',
    password: 'root',
    database: 'easycar'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');
});

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

app.post('/register', (req, res) => { // 处理注册请求
    const username = req.body.username;
    const password = req.body.password;
    const phone = req.body.phone;

    bcrypt.hash(password, saltRounds, (err, hashed_password) => { // 密码哈希
        if (err) {
            res.status(500).json({ error: '未知错误' });
            return;
        }

        db.query('INSERT INTO users (name, hashed_password, phone) VALUES (?, ?, ?)',
            [username, hashed_password, phone], (err, results) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        res.status(400).json({ error: '用户名已存在' });
                    } else {
                        res.status(500).json({ error: '未知错误' });
                    }
                    return;
                }
                res.json({ id: results.insertId });
            });
    });
});

app.post('/login', (req, res) => { // 处理登录请求
    const username = req.body.username;
    const password = req.body.password;
    db.query('SELECT * FROM users WHERE name = ?', [username], (err, results) => {
        if (err) {
            res.status(500).json({ error: '未知错误' });
            return;
        }
        if (results.length === 0) {
            res.status(400).json({ error: '用户不存在' });
        } else {
            bcrypt.compare(password, results[0].hashed_password, (err, result) => {
                if (err) throw err;
                if (result) {
                    const token = jwt.sign({ userID: results[0].id.toString() }, secretKey, { expiresIn: '1h' });
                    res.json({ userID: results[0].id.toString(), token: token });
                } else {
                    res.status(400).json({ error: '密码错误' });
                }
            });
        }
    });
});

app.post('/forgot', (req, res) => { // 处理忘记密码请求
    const username = req.body.username;
    const phone = req.body.phone;
    const new_password = req.body.new_password;
    bcrypt.hash(new_password, saltRounds, (err, hashed_password) => { // 密码哈希
        if (err) {
            console.log(err)
            res.status(500).json({ error: '未知错误' });
            return;
        }
        db.query('UPDATE users SET hashed_password = ? WHERE name = ? AND phone = ?',
            [hashed_password, username, phone], (err, results) => {
                if (err) {
                    console.log(err)
                    res.status(500).json({ error: '未知错误' });
                    return;
                }
                if (results.affectedRows === 0) {
                    res.status(400).json({ error: '用户不存在或手机号码不匹配' });
                } else {
                    res.sendStatus(200);
                }
            });
    });
});

app.get('/verify', verifyToken, (req, res) => { res.sendStatus(200); });

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: '请重新登录' }) // 如果没有 token，返回 401
        return
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            res.status(403).json({ error: '请重新登录' }) // 如果 token 无效，返回 403
            return
        }
        req.userID = user.userID; // 将 userID 保存在请求中
        next(); // 如果 token 有效，继续处理请求
    });
}

app.use(verifyToken); // 使用中间件验证 token


app.get('/parking_lots/:id', (req, res) => { // 处理网点信息请求
    const id = req.params.id;
    db.query('SELECT * FROM parking_lots WHERE id = ?', [id], (err, results) => {
        if (err) {
            res.status(500).json({ error: '未知错误' });
            return;
        }
        const lotResults = results[0];
        db.query('SELECT * FROM cars WHERE lot_id = ?', [id], (err, carResults) => {
            if (err) {
                res.status(500).json({ error: '未知错误' });
                return;
            }
            lotResults.cars = carResults;
            res.json(lotResults);
        });
    });
});

app.post('/place_order', async (req, res) => { // 处理下单请求
    try {
        await query('START TRANSACTION'); // 开始事务
        const orderResult = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.userID]); // 确定用户订单状态
        if (orderResult.length > 0 && orderResult[0].is_paid !== 1) {
            res.status(400).json({ error: '您有未完成订单' });
            return;
        }
        const result = await query(`INSERT INTO orders (
            order_type,
            start_time,
            end_time,
            price,
            is_paid,
            pickup_lot_id,
            return_lot_id,
            user_id,
            car_id
            ) 
            VALUES (?, ?, NULL, NULL, NULL, ?, NULL, ?, ?)`,
            [req.body.orderType, req.body.startTime,
            req.body.lotID, req.userID, req.body.carID])
        await query('UPDATE cars SET car_status = "占用", lot_id = NULL WHERE id = ?', [req.body.carID]) // 更新车辆信息
        await query('UPDATE parking_lots SET available_spots = available_spots + 1 WHERE id = ?', [req.body.lotID]) // 更新网点信息
        await query('COMMIT'); // 提交事务
        res.json({ id: result.insertId });
    } catch (err) {
        await query('ROLLBACK'); // 回滚事务
        console.log(err);
        res.status(500).json({ error: '未知错误' });
        return;
    }
});

app.get('/orders/:id', (req, res) => { // 处理订单信息请求
    if (req.params.id !== req.userID) {
        res.status(403).json({ error: '无权访问' });
        return;
    }
    db.query(`SELECT 
    orders.id, order_type, start_time, end_time, price, is_paid, 
    lotA.name AS pickup_lot, lotB.name AS return_lot, model 
    FROM orders 
    JOIN cars ON orders.car_id = cars.id 
    JOIN parking_lots AS lotA ON orders.pickup_lot_id = lotA.id 
    LEFT JOIN parking_lots AS lotB ON orders.return_lot_id = lotB.id 
    WHERE user_id = ? 
    ORDER BY orders.id DESC`, [req.userID], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: '未知错误' });
            return;
        }
        res.json(results);
    });
})

app.post('/complete_order/:id', async (req, res) => { // 处理完成订单请求
    try {
        await query('START TRANSACTION'); // 开始事务
        const orderResults = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]); // 确定订单存在
        if (orderResults.length === 0) {
            res.status(400).json({ error: '订单不存在' });
            return;
        }
        const start_time = new Date(orderResults[0].start_time);
        const currentTime = new Date();
        const timeDiff = currentTime.getTime() - start_time.getTime();
        const hours = Math.ceil(timeDiff / (1000 * 60 * 60));
        const days = Math.ceil(hours / 24);
        const carID = orderResults[0].car_id;
        const carResults = await query('SELECT * FROM cars WHERE id = ?', [carID]);
        const lotID = req.body.lotName.slice(-1)
        let price = 0;
        if (orderResults[0].order_type === '日租') { // 计算订单价格
            price = days * carResults[0].daily_price;
        }
        else {
            price = hours * carResults[0].hourly_price;
        }
        await query('UPDATE orders SET end_time = ?, price = ?, is_paid = FALSE, return_lot_id = ? WHERE id = ?', // 更新订单信息
            [currentTime.toLocaleString().replace(/\//g, '-'), price, lotID, req.params.id]);
        await query('UPDATE cars SET car_status = "空闲", lot_id = ? WHERE id = ?', [lotID, carID]); // 更新车辆信息
        await query('UPDATE parking_lots SET available_spots = available_spots - 1 WHERE id = ?', [lotID]) // 更新网点信息
        await query('COMMIT'); // 提交事务
        res.sendStatus(200);
    } catch (err) {
        await query('ROLLBACK'); // 回滚事务
        console.log(err);
        if (err.code === 'ER_DATA_OUT_OF_RANGE') {
            res.status(400).json({ error: '网点已满' });
            return;
        } else {
            res.status(500).json({ error: '未知错误' });
            return;
        }
    }
});

app.post('/pay_order/:id', async (req, res) => { // 处理支付订单请求
    try {
        const orderResults = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]); // 确定订单存在
        if (orderResults.length === 0) {
            res.status(400).json({ error: '订单不存在' });
            return;
        }
        await query('UPDATE orders SET is_paid = TRUE WHERE id = ?', [req.params.id]); // 更新订单信息
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: '未知错误' });
        return;
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
