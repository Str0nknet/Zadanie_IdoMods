
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


app.get('/orders/csv', basicAuth, (_, res) => {
    const orders = loadOrders();
    if (!orders.length) {
        console.log("Brak zamówień w db.json");
        return res.status(404).json({ error: 'No orders found' });
    }

    const records = [];

    orders.forEach(order => {
        const base = {
            orderID: order.orderID,
            orderWorth: order.orderWorth
        };

        const products = order.products || [];
        if (products.length) {
            products.forEach(p => {
                records.push({
                    ...base,
                    productID: p.productID,
                    quantity: p.quantity
                });
            });
        } else {
            records.push({
                ...base,
                productID: 'N/A',
                quantity: 0
            });
        }
    });

    const writer = csv({
        path: 'orders.csv',
        header: [
            { id: 'orderID', title: 'Order ID' },
            { id: 'productID', title: 'Product ID' },
            { id: 'quantity', title: 'Quantity' },
            { id: 'orderWorth', title: 'Order Worth' }
        ]
    });

    writer.writeRecords(records).then(() => {
        console.log("Eksport zakończony. Wysyłanie pliku...");
        res.download('orders.csv');
    }).catch(err => {
        console.error('Błąd eksportu CSV:', err);
        res.status(500).json({ error: 'CSV export failed' });
    });
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




// Harmonogram uruchamiania fetch_orders co 24h
schedule.scheduleJob('0 0 * * *', () => {
    console.log("Fetching orders (auto)...")
    exec("node fetch_orders.js", (err, stdout, stderr) => {
        if (err) console.error("Fetch failed:", stderr);
        else console.log("Orders fetched:", stdout);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

      console.log("Fetching orders on startup...");
      exec("node fetch_orders.js", (err, stdout, stderr) => {
          if (err) {
              console.error("Initial fetch failed:", stderr);
          } else {
              console.log("Orders fetched on startup.");
          }
      });
  
});
