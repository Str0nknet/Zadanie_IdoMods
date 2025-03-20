const apiUrl = "https://brandstestowy.smallhost.pl/api/random";
let pageNumber = 1;
let pageSize = 16; 
let isLoading = false;
let hasMoreProducts = true;
let infiniteScrollEnabled = false;

// Pobranie referencji do checkboxa i selecta
const enableScrollCheckbox = document.getElementById("enableScroll");
const pageSizeSelect = document.getElementById("pageSize");

pageSizeSelect.value = pageSize;

// Obsługa zmiany liczby produktów
pageSizeSelect.addEventListener("change", function () {
    pageSize = parseInt(this.value);
    pageNumber = 1; 
    hasMoreProducts = true;
    document.getElementById("products-container").innerHTML = ""; 
    loadProducts(); 
});

// Obsługa zmiany ustawienia Infinite Scroll
enableScrollCheckbox.addEventListener("change", function () {
    infiniteScrollEnabled = this.checked;
    console.log("Infinite Scroll:", infiniteScrollEnabled ? "Włączony" : "Wyłączony");
    pageNumber = 1; 
    document.getElementById("products-container").innerHTML = ""; 
    loadProducts(); 
});

// Pobieranie produktów
function loadProducts(isScrollLoad = false) {
    if (isLoading || !hasMoreProducts) return;
    isLoading = true;
    document.querySelector(".loader").style.display = "block";

    let fetchPageSize = pageSize; 
    if (isScrollLoad) {
        fetchPageSize = pageSize; 
    }

    fetch(`${apiUrl}?pageNumber=${pageNumber}&pageSize=${fetchPageSize}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dane z API:", data);

            if (pageNumber === 1 && !isScrollLoad) {
                document.getElementById("products-container").innerHTML = ""; 
                hasMoreProducts = true;
            }

            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                renderProducts(data.data);
                pageNumber++; 
            } else {
                hasMoreProducts = false; 
            }

            isLoading = false;
            document.querySelector(".loader").style.display = "none";
        })
        .catch(error => {
            console.error("Błąd w pobieraniu danych:", error);
            isLoading = false;
            document.querySelector(".loader").style.display = "none";
        });
}

// Renderowanie produktów na stronie
function renderProducts(products) {
    const container = document.getElementById("products-container");

    products.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";
        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.text}" width="150">
            <h3>${product.text}</h3>
        `;
        productDiv.addEventListener("click", () => showPopup(product));
        container.appendChild(productDiv);
    });
}

// Wyświetlanie popupu
function showPopup(product) {
    document.getElementById("popup-title").textContent = product.text;
    document.getElementById("popup-description").innerHTML = `
        <img src="${product.image}" width="200"><br>${product.text}
    `;
    document.querySelector(".popup").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

// Zamknięcie popupu
document.querySelector(".close").addEventListener("click", closePopup);
document.querySelector(".overlay").addEventListener("click", closePopup);

function closePopup() {
    document.querySelector(".popup").style.display = "none";
    document.querySelector(".overlay").style.display = "none";
}

//Obsługa Infinite Scroll
window.addEventListener("scroll", () => {
    if (infiniteScrollEnabled && hasMoreProducts && !isLoading && window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        loadProducts(true); 
    }
});

loadProducts();
