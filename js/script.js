/* --- LOGICA MULTI-FREEZER --- */

// 1. CARICAMENTO DATI: Prendiamo l'intero oggetto dei freezer o ne creiamo uno vuoto
let datiFreezer = JSON.parse(localStorage.getItem('multi_freezer')) || { "Principale": [] };
let freezerAttivo = localStorage.getItem('freezer_attuale') || "Principale";

// Inizializziamo l'app al caricamento della pagina
window.onload = function() {
    aggiornaMenuFreezer();
    mostraLista();
};

// 2. GESTIONE MENU: Crea le opzioni nel menu a tendina
function aggiornaMenuFreezer() {
    const select = document.getElementById('selectFreezer');
    if(!select) return;
    
    select.innerHTML = "";
    for (let nome in datiFreezer) {
        let opt = document.createElement('option');
        opt.value = nome;
        opt.innerHTML = "❄️ " + nome;
        if (nome === freezerAttivo) opt.selected = true;
        select.appendChild(opt);
    }
}

// 3. CAMBIO FREEZER: Salva quale freezer stai guardando e aggiorna la lista
function cambiaFreezer() {
    freezerAttivo = document.getElementById('selectFreezer').value;
    localStorage.setItem('freezer_attuale', freezerAttivo);
    mostraLista();
}

// 4. CREA NUOVO: Aggiunge un nuovo freezer (es. "Garage")
function nuovoFreezer() {
    let nome = prompt("Nome del nuovo freezer? (es. Garage)");
    if (nome && !datiFreezer[nome]) {
        datiFreezer[nome] = []; // Crea una lista vuota per quel nome
        freezerAttivo = nome;
        salvaTutto();
        aggiornaMenuFreezer();
        mostraLista();
    } else if (datiFreezer[nome]) {
        alert("Questo freezer esiste già!");
    }
}

// 5. MOSTRA LISTA: Questa è la funzione che disegna le Card sul telefono
function mostraLista() {
    const listaUl = document.getElementById('listaCibo');
    listaUl.innerHTML = ""; 
    
    // Prendiamo solo i prodotti del freezer selezionato
    const prodotti = datiFreezer[freezerAttivo];
    const oggi = new Date();

    prodotti.forEach((item, index) => {
        let dataScadenza = new Date(item.data);
        dataScadenza.setMonth(dataScadenza.getMonth() + parseInt(item.mesi));
        const giorniRimanenti = Math.ceil((dataScadenza - oggi) / (1000 * 60 * 60 * 24));

        const li = document.createElement('li');
        
        // Assegniamo la classe CSS per il colore della barra laterale
        if (giorniRimanenti <= 0) li.className = "stato-scaduto";
        else if (giorniRimanenti < 30) li.className = "stato-attenzione";
        else li.className = "stato-ok";

        li.innerHTML = `
            <div>
                <strong>${item.nome}</strong><br>
                <small class="data-scadenza">Inserito: ${item.data} - SCADE IL: ${dataScadenza.toLocaleDateString()}</small>
            </div>
            <button onclick="eliminaProdotto(${index})">×</button>
        `;
        listaUl.appendChild(li);
    });
}

// 6. AGGIUNGI E ELIMINA: Operazioni sui dati
function aggiungiInInventario() {
    const nome = document.getElementById('nome').value;
    const data = document.getElementById('data').value;
    const mesi = document.getElementById('mesi').value;

    if (nome && data && mesi) {
        const nuovoProdotto = { nome, data, mesi: parseInt(mesi) };
        // Aggiungiamo il prodotto solo alla lista del freezer attivo
        datiFreezer[freezerAttivo].push(nuovoProdotto);
        
        salvaTutto();
        mostraLista();
        
        // Puliamo i campi
        document.getElementById('nome').value = "";
    } else {
        alert("Riempi tutti i campi!");
    }
}

function eliminaProdotto(index) {
    datiFreezer[freezerAttivo].splice(index, 1);
    salvaTutto();
    mostraLista();
}

function salvaTutto() {
    localStorage.setItem('multi_freezer', JSON.stringify(datiFreezer));
    localStorage.setItem('freezer_attuale', freezerAttivo);
}