import requests
import json
from datetime import datetime, timedelta 
from config import API_URL, API_KEY

HEADERS = {
    "accept": "application/json",
    "X-API-KEY": API_KEY
}

#Pobieramy zamówienia z ostatnich 30 dni
start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
search_params = {
    "dateFrom": start_date,  
    "limit": 100  
}

def fetch_orders():
    """ Pobiera zamówienia z API IdoSell i zapisuje do 'db.json' """
    response = requests.get(API_URL, headers=HEADERS, params=search_params)  

    print(f"Status Code: {response.status_code}")

    #Zapisujemy odpowiedź API do pliku (pomocne do debugowania)
    with open("response.json", "w") as resp_file:
        resp_file.write(response.text)

    try:
        data = response.json()
    except json.JSONDecodeError:
        print("Błąd: API zwróciło niepoprawny JSON.")
        return

    #Sprawdzamy, czy mamy klucz "Results"
    if "Results" not in data or not isinstance(data["Results"], list):
        print("Błąd: Nie znaleziono klucza 'Results' w odpowiedzi API.")
        return

    orders_list = data["Results"]

    if not orders_list:
        print("Brak zamówień w API.")
        return

    #Ekstrakcja potrzebnych danych
    orders = []
    for order in orders_list:
        
        products = order.get("productsResults", [])
        if not isinstance(products, list):
            products = []

        extracted_order = {
            "orderID": order.get("orderId"),
            "orderSerialNumber": order.get("orderSerialNumber"),
            "orderType": order.get("orderType"),
            "orderStatus": order.get("orderDetails", {}).get("orderStatus", ""),
            "orderChangeDate": order.get("orderDetails", {}).get("orderChangeDate", ""),
            "orderAddDate": order.get("orderDetails", {}).get("orderAddDate", ""),
            "purchaseDate": order.get("orderDetails", {}).get("purchaseDate", ""),
            "orderWorth": order.get("orderDetails", {}).get("payments", {}).get("orderCurrency", {}).get("orderProductsCost", 0),
            "currency": order.get("orderDetails", {}).get("payments", {}).get("orderCurrency", {}).get("currencyId", ""),
            "paymentType": order.get("orderDetails", {}).get("payments", {}).get("orderPaymentType", ""),
            "deliveryMethod": order.get("orderDetails", {}).get("dispatch", {}).get("courierName", ""),
            "deliveryWeight": order.get("orderDetails", {}).get("dispatch", {}).get("deliveryWeight", ""),
            "client": {
                "clientId": order.get("clientResult", {}).get("endClientAccount", {}).get("clientId", ""),
                "clientEmail": order.get("clientResult", {}).get("endClientAccount", {}).get("clientEmail", ""),
                "clientPhone": order.get("clientResult", {}).get("endClientAccount", {}).get("clientPhone1", ""),
                "clientName": order.get("clientResult", {}).get("clientBillingAddress", {}).get("clientFirstName", "") + " " +
                              order.get("clientResult", {}).get("clientBillingAddress", {}).get("clientLastName", ""),
                "clientCountry": order.get("clientResult", {}).get("clientBillingAddress", {}).get("clientCountryName", "")
            },
            "products": [
                {
                    "productID": item.get("productId", "N/A"),
                    "productName": item.get("productName", "Unknown Product"),
                    "quantity": item.get("productQuantity", 0),
                    "productPrice": item.get("productOrderPrice", 0.0)
                }
                for item in products  #Pobieramy produkty, nawet jeśli są puste
            ]
        }
        orders.append(extracted_order)

    if not orders:
        print("Nie znaleziono produktów do zapisania.")
        return

    #Zapisujemy dane do 'db.json'
    with open("db.json", "w") as db_file:
        json.dump(orders, db_file, indent=4, ensure_ascii=False)

    print("Zamówienia zostały zaktualizowane i zapisane do 'db.json'.")

if __name__ == "__main__":
    fetch_orders()
