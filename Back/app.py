from flask import Flask, jsonify, request, Response, send_file
import json
import csv
import threading
import time
import subprocess  
from functools import wraps

app = Flask(__name__)

#Stałe dane logowania dla uproszczenia na potrzeby zadania 
USERNAME = "admin"
PASSWORD = "admin"

#Basic Auth - Weryfikacja użytkownika
def basic_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or auth.username != USERNAME or auth.password != PASSWORD:
            return Response("Unauthorized", 401, {"WWW-Authenticate": "Basic realm='Login Required'"})
        return f(*args, **kwargs)
    return decorated

#Wczytanie zamówień z `db.json`
def load_orders():
    try:
        with open("db.json", "r") as db_file:
            orders = json.load(db_file)
            if not isinstance(orders, list):  
                raise ValueError("Invalid JSON format")
            return orders
    except (FileNotFoundError, json.JSONDecodeError, ValueError):
        return []  

#Pobieranie wszystkich zamówień z filtrowaniem
@app.route("/orders", methods=["GET"])
@basic_auth
def get_orders():
    min_worth = request.args.get("minWorth", type=float, default=0)
    max_worth = request.args.get("maxWorth", type=float, default=float("inf"))

    orders = load_orders()
    filtered_orders = [o for o in orders if min_worth <= o["orderWorth"] <= max_worth]

    return jsonify(filtered_orders), 200

#Pobranie konkretnego zamówienia
@app.route("/orders/<order_id>", methods=["GET"])
@basic_auth
def get_order(order_id):
    orders = load_orders()
    order = next((o for o in orders if str(o["orderID"]) == order_id), None)

    if order:
        return jsonify(order), 200
    else:
        return jsonify({"error": "Order not found"}), 404

#Eksport zamówień do CSV
@app.route("/orders/csv", methods=["GET"])
@basic_auth
def export_orders_csv():
    orders = load_orders()

    if not orders:
        return jsonify({"error": "No orders found"}), 404

    csv_filename = "orders.csv"

    with open(csv_filename, "w", newline="") as csv_file:
        writer = csv.writer(csv_file)

        #Nagłówki CSV
        writer.writerow([
            "Order ID", "Serial Number", "Order Status", "Change Date", "Purchase Date",
            "Order Worth", "Currency", "Payment Type", "Delivery Method",
            "Client Name", "Client Email", "Client Phone",
            "Product ID", "Product Name", "Quantity", "Product Price"
        ])

        #Zapisujemy każde zamówienie
        for order in orders:
            order_id = order["orderID"]
            serial_number = order.get("orderSerialNumber", "N/A")
            status = order.get("orderStatus", "N/A")
            change_date = order.get("orderChangeDate", "N/A")
            purchase_date = order.get("purchaseDate", "N/A")
            order_worth = order.get("orderWorth", 0)
            currency = order.get("currency", "N/A")
            payment_type = order.get("paymentType", "N/A")
            delivery_method = order.get("deliveryMethod", "N/A")
            
           
            client = order.get("client", {})
            client_name = client.get("clientName", "N/A")
            client_email = client.get("clientEmail", "N/A")
            client_phone = client.get("clientPhone", "N/A")

            
            products = order.get("products", [])

            if products:
                for product in products:
                    writer.writerow([
                        order_id, serial_number, status, change_date, purchase_date,
                        order_worth, currency, payment_type, delivery_method,
                        client_name, client_email, client_phone,
                        product.get("productID", "N/A"),
                        product.get("productName", "Unknown Product"),
                        product.get("quantity", 0),
                        product.get("productPrice", 0.0)
                    ])
            else:
                #Zamówienia BEZ produktów
                writer.writerow([
                    order_id, serial_number, status, change_date, purchase_date,
                    order_worth, currency, payment_type, delivery_method,
                    client_name, client_email, client_phone,
                    "N/A", "No Products", 0, 0.0
                ])

    return send_file(csv_filename, mimetype="text/csv", as_attachment=True, download_name="orders.csv")


#Automatyczna aktualizacja danych co 24 godziny
def scheduled_fetch_orders():
    while True:
        print("Uruchamiam 'fetch_orders.py'...")
        try:
         
            subprocess.run(["python3", "fetch_orders.py"], check=True)
            print("Zamówienia pobrane i zapisane do 'db.json'.")
        except subprocess.CalledProcessError:
            print("Błąd podczas pobierania zamówień!")

        print("Czekam 24h na kolejną aktualizację...")
        time.sleep(86400) 

if __name__ == "__main__":

    update_thread = threading.Thread(target=scheduled_fetch_orders, daemon=True)
    update_thread.start()

    print("\nServer is starting... Use the credentials: admin / admin to access the API.\n")
    app.run(debug=True)
