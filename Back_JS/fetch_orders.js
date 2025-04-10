const axios = require("axios");
const fs = require("fs");
//const { format } = require("date-fns");

const API_URL = "https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders";
const API_KEY = "PUT_IN";

//const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

const fetchOrders = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": API_KEY,
            },
            params: {
                dateFrom: "2000-01-01" 
            }
        });

        const data = response.data;
        fs.writeFileSync("response.json", JSON.stringify(data, null, 2)); // Debug info

        if (!data.Results || !Array.isArray(data.Results)) {
            console.error("Brak pola 'Results' w odpowiedzi API.");
            return;
        }

        const Orders = data.Results.map(order => {
            const rawProducts = order.orderDetails?.productsResults || [];

            const products = Array.isArray(rawProducts)
                ? rawProducts.map(p => ({
                    productID: p.productId || "N/A",
                    quantity: p.productQuantity || 0
                }))
                : [];

            return {
                orderID: order.orderId || "unknown",
                orderWorth: order.orderDetails?.payments?.orderCurrency?.orderProductsCost || 0,
                products
            };
        });

        fs.writeFileSync("db.json", JSON.stringify(Orders, null, 2), "utf8");
        console.log("Zamówienia zostały zapisane do 'db.json'.");

    } catch (err) {
        console.error("Błąd pobierania zamówień:", err.message);
    }
};

fetchOrders();
