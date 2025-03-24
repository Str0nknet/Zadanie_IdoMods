const axios = require("axios");
const fs = require("fs");
const { format } = require("date-fns");

//Dane konfiguracyjne
const API_URL = "https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders";
const API_KEY = "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP";

//Pobieramy zamówienia z ostatnich 30 dni
const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

const fetchOrders = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": API_KEY,
            },
            params: {
                dateFrom: startDate,
                limit: 100
            }
        });

        const data = response.data;

        // Zapisz surową odpowiedź (do debugowania)
        fs.writeFileSync("response.json", JSON.stringify(data, null, 2));

        if (!data.Results || !Array.isArray(data.Results)) {
            console.error("Nie znaleziono pola 'Results' w odpowiedzi API.");
            return;
        }

        const orders = data.Results.map(order => {
            const products = Array.isArray(order.productsResults) ? order.productsResults : [];

            return {
                orderID: order.orderId,
                orderSerialNumber: order.orderSerialNumber,
                orderType: order.orderType,
                orderStatus: order.orderDetails?.orderStatus || "",
                orderChangeDate: order.orderDetails?.orderChangeDate || "",
                orderAddDate: order.orderDetails?.orderAddDate || "",
                purchaseDate: order.orderDetails?.purchaseDate || "",
                orderWorth: order.orderDetails?.payments?.orderCurrency?.orderProductsCost || 0,
                currency: order.orderDetails?.payments?.orderCurrency?.currencyId || "",
                paymentType: order.orderDetails?.payments?.orderPaymentType || "",
                deliveryMethod: order.orderDetails?.dispatch?.courierName || "",
                deliveryWeight: order.orderDetails?.dispatch?.deliveryWeight || "",
                client: {
                    clientId: order.clientResult?.endClientAccount?.clientId || "",
                    clientEmail: order.clientResult?.endClientAccount?.clientEmail || "",
                    clientPhone: order.clientResult?.endClientAccount?.clientPhone1 || "",
                    clientName: `${order.clientResult?.clientBillingAddress?.clientFirstName || ""} ${order.clientResult?.clientBillingAddress?.clientLastName || ""}`.trim(),
                    clientCountry: order.clientResult?.clientBillingAddress?.clientCountryName || ""
                },
                products: products.map(p => ({
                    productID: p.productId || "N/A",
                    productName: p.productName || "Unknown Product",
                    quantity: p.productQuantity || 0,
                    productPrice: p.productOrderPrice || 0.0
                }))
            };
        });

        if (!orders.length) {
            console.log("Brak zamówień do zapisania.");
            return;
        }

        fs.writeFileSync("db.json", JSON.stringify(orders, null, 2), "utf8");
        console.log("Zamówienia zostały zaktualizowane i zapisane do 'db.json'.");

    } catch (err) {
        console.error("Błąd podczas pobierania zamówień:", err.message);
    }
};

fetchOrders();
