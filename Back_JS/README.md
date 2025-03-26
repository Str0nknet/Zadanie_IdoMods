#IdoSell Orders API (Node.js)

**Autor:** Krzysztof Pulak  
**Opis:**  
Zadanie rekrutacyjne – REST API do pobierania zamówień z IdoSell, filtrowania po wartości oraz eksportu do CSV.  

-------------------------------------------------------

###Funkcje API:
- Pobieranie zamówień (z Basic Auth)  
- Filtrowanie po wartości (minWorth, maxWorth)  
- Pobranie konkretnego zamówienia (orderID)  
- Eksport zamówień do .csv  
- Automatyczna aktualizacja zamówień co 24h (z fetch_orders.js)

----------------------------------------------------------

##Jak uruchomić API?

### 1. Zainstaluj zależności:

bash
npm install express basic-auth fs csv-writer axios node-schedule date-fns


### 2. Uruchom serwer:

bash
node app.js


Serwer uruchomi się pod adresem:  
http://127.0.0.1:5000

--------------------------------------------------------------------------

##Autoryzacja

API jest zabezpieczone **Basic Auth**.  
Dane logowania:


Username: admin
Password: admin


Każde zapytanie do /orders, /orders/:id, /orders/csv wymaga autoryzacji.

Przykład (curl):

bash
curl -u admin:admin http://127.0.0.1:5000/orders


----------------------------------------------------------

##Pobieranie zamówień

###Wszystkie zamówienia:
bash
curl -u admin:admin http://127.0.0.1:5000/orders


###Zamówienie o ID aaaaa-1:
bash
curl -u admin:admin http://127.0.0.1:5000/orders/aaaaa-1


--------------------------------------------------------

##Filtrowanie zamówień

### Zamówienia od 100 do 500 zł:
bash
curl -u admin:admin "http://127.0.0.1:5000/orders?minWorth=100&maxWorth=500"


### Zamówienia powyżej 200 zł:
bash
curl -u admin:admin "http://127.0.0.1:5000/orders?minWorth=200"


### Zamówienia do 300 zł:
bash
curl -u admin:admin "http://127.0.0.1:5000/orders?maxWorth=300"


-------------------------------------------------------------------

##Eksport zamówień do CSV

Pobierz wszystkie zamówienia jako plik CSV:

bash
curl -u admin:admin -o orders.csv http://127.0.0.1:5000/orders/csv


Plik zostanie zapisany jako orders.csv w katalogu, w którym uruchomiłeś komendę.

------------------------------------------------------------------------

##Automatyczna aktualizacja

Serwer automatycznie uruchamia fetch_orders.js co 24 godziny i aktualizuje plik db.json.

Możesz też ręcznie uruchomić aktualizację:

bash
node fetch_orders.js


