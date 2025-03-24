
const express = require('express');
const fs = require('fs');
const csv = require('csv-writer').createObjectCsvWriter;
const auth = require('basic-auth');
const schedule = require('node-schedule');
const { exec } = require('child_process');
const app = express();
const PORT = 5000;

const USERNAME = 'admin';
const PASSWORD = 'admin';

function basicAuth(req, res, next) {
    const user = auth(req);
    if (!user || user.name !== USERNAME || user.pass !== PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="Login Required"');
        return res.status(401).send('Unauthorized');
    }
    next();
}

function loadOrders() {
    try {
        const data = fs.readFileSync('db.json', 'utf8');
        const orders = JSON.parse(data);
        return Array.isArray(orders) ? orders : [];
    } catch (err) {
        return [];
    }
}

app.get('/', (_, res) => {
    res.send(`
        <h2> Witaj w  IdoSell Orders API</h2>
        <p>Użyj <code>/orders</code> lub <code>/orders/csv</code> z Basic Auth.</p>
        <p>Author: Krzysztof Pulak — 
            <a href="https://github.com/Str0nknet/Zadanie_IdoMods" target="_blank">
                https://github.com/Str0nknet/Zadanie_IdoMods
            </a>
        </p>
    `);
});



app.get('/orders', basicAuth, (req, res) => {
    const minWorth = parseFloat(req.query.minWorth) || 0;
    const maxWorth = parseFloat(req.query.maxWorth) || Infinity;
    const orders = loadOrders();
    const filtered = orders.filter(o => o.orderWorth >= minWorth && o.orderWorth <= maxWorth);
    res.json(filtered);
});

app.get('/orders/:id', basicAuth, (req, res) => {
    const orders = loadOrders();
    const order = orders.find(o => String(o.orderID) === req.params.id);
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.get('/orders/csv', basicAuth, (req, res) => {
    const orders = loadOrders();
    if (!orders.length) return res.status(404).json({ error: 'No orders found' });

    const records = [];

    orders.forEach(order => {
        const baseData = {
            orderID: order.orderID,
            serialNumber: order.orderSerialNumber || 'N/A',
            status: order.orderStatus || 'N/A',
            changeDate: order.orderChangeDate || 'N/A',
            purchaseDate: order.purchaseDate || 'N/A',
            worth: order.orderWorth || 0,
            currency: order.currency || 'N/A',
            paymentType: order.paymentType || 'N/A',
            deliveryMethod: order.deliveryMethod || 'N/A',
            clientName: (order.client?.clientName || 'N/A'),
            clientEmail: (order.client?.clientEmail || 'N/A'),
            clientPhone: (order.client?.clientPhone || 'N/A')
        };

        const products = order.products || [];
        if (products.length) {
            products.forEach(p => {
                records.push({
                    ...baseData,
                    productID: p.productID || 'N/A',
                    productName: p.productName || 'Unknown Product',
                    quantity: p.quantity || 0,
                    productPrice: p.productPrice || 0
                });
            });
        } else {
            records.push({
                ...baseData,
                productID: 'N/A',
                productName: 'No Products',
                quantity: 0,
                productPrice: 0
            });
        }
    });

    const writer = csv({
        path: 'orders.csv',
        header: [
            { id: 'orderID', title: 'Order ID' },
            { id: 'serialNumber', title: 'Serial Number' },
            { id: 'status', title: 'Order Status' },
            { id: 'changeDate', title: 'Change Date' },
            { id: 'purchaseDate', title: 'Purchase Date' },
            { id: 'worth', title: 'Order Worth' },
            { id: 'currency', title: 'Currency' },
            { id: 'paymentType', title: 'Payment Type' },
            { id: 'deliveryMethod', title: 'Delivery Method' },
            { id: 'clientName', title: 'Client Name' },
            { id: 'clientEmail', title: 'Client Email' },
            { id: 'clientPhone', title: 'Client Phone' },
            { id: 'productID', title: 'Product ID' },
            { id: 'productName', title: 'Product Name' },
            { id: 'quantity', title: 'Quantity' },
            { id: 'productPrice', title: 'Product Price' }
        ]
    });

    writer.writeRecords(records).then(() => {
        res.download('orders.csv');
    }).catch(err => {
        console.error('CSV export error:', err);
        res.status(500).json({ error: 'CSV export failed' });
    });
});

// Harmonogram uruchamiania fetch_orders co 24h
schedule.scheduleJob('0 0 * * *', () => {
    console.log("Fetching orders (auto)...")
    exec("node fetch_orders.js", (err, stdout, stderr) => {
        if (err) console.error("Fetch failed:", stderr);
        else console.log("Orders fetched:", stdout);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
