#IdoSell Orders API

**Autor:** Krzysztof Pulak 
**Opis:**  
Zadanie rekrutacyjne - REST API do pobierania zamówień z IdoSell, filtrowania po wartości oraz eksportu do CSV.  

**Funkcje API:**  
Pobieranie zamówień (z Basic Auth)  
Filtrowanie zamówień po wartości ('minWorth', 'maxWorth')  
Pobranie konkretnego zamówienia ('orderID')  
Eksport zamówień do CSV  
Automatyczna aktualizacja zamówień co 24h  

---------------------------------------

##Jak uruchomić API?
**Zainstaluj zależności**  

bash
pip install flask requests

**Uruchom serwer API**  

bash
python3 app.py

**Zaloguj się w API**  
**Login:** 'admin'  
**Hasło:** 'admin'  

**API działa na 'http://127.0.0.1:5000'**  

--------------------------------------------

##Autoryzacja
API jest zabezpieczone **Basic Auth**.  
Każde zapytanie wymaga podania loginu i hasła:  

bash
curl -u admin:admin "http://127.0.0.1:5000/orders"


------------------------------------------------------------

##Pobieranie zamówień
###Pobierz wszystkie zamówienia
bash
curl -u admin:admin "http://127.0.0.1:5000/orders"


###Pobierz zamówienie o ID 'aaaaa-1'
bash
curl -u admin:admin "http://127.0.0.1:5000/orders/aaaaa-1"


------------------------------------------------------------------

###Filtrowanie zamówień po wartości
📌 Możesz filtrować zamówienia po wartości ('orderWorth').  

###Zamówienia od 100 do 500 zł
bash
curl -u admin:admin "http://127.0.0.1:5000/orders?minWorth=100&maxWorth=500"


###Zamówienia powyżej 200 zł
bash
curl -u admin:admin "http://127.0.0.1:5000/orders?minWorth=200"


###Zamówienia do 300 zł
bash
curl -u admin:admin "http://127.0.0.1:5000/orders?maxWorth=300"


---

##Eksport zamówień do CSV
Możesz pobrać wszystkie zamówienia jako plik '.csv'  

###Pobierz 'orders.csv'
bash
curl -u admin:admin -o orders.csv "http://127.0.0.1:5000/orders/csv"

**Plik 'orders.csv' zostanie zapisany w katalogu, w którym uruchomiłeś komendę.**

------------------------------------------

##Automatyczna aktualizacja zamówień
API automatycznie pobiera nowe zamówienia **co 24 godziny**.  
Nie musisz robić nic – serwer sam aktualizuje dane w 'db.json'.  

**Jeśli chcesz wymusić aktualizację od razu:**  
bash
python3 fetch_orders.py


--------------------------------------------------------------

##Struktura 'db.json'
**Przykładowa zawartość 'db.json':**
json
[
  {
    "orderID": "aaaaa-1",
    "orderSerialNumber": 11,
    "orderStatus": "canceled",
    "orderChangeDate": "2022-06-01 22:32:45",
    "purchaseDate": "2021-09-14",
    "orderWorth": 64,
    "currency": "PLN",
    "paymentType": "cash_on_delivery",
    "deliveryMethod": "Odbiór osobisty",
    "client": {
      "clientName": "Jan Kowalski",
      "clientEmail": "jan.kowalski@email.com",
      "clientPhone": "123456789"
    },
    "products": [
      {
        "productID": "1001",
        "productName": "Karma dla psa",
        "quantity": 2,
        "productPrice": 99.50
      }
    ]
  }
]


--------------------------------------------------------------------

##Struktura katalogów

/Back/
│── app.py          # Serwer API Flask
│── fetch_orders.py  # Pobiera zamówienia z IdoSell
│── db.json         # Baza danych zamówień
│── orders.csv      # Eksport CSV (tworzy się po zapytaniu)
│── README.md       # Dokumentacja projektu






