// Recuperiamo i dati salvati nel browser o creiamo una lista vuota
let inventario = JSON.parse(localStorage.getItem('freezer_data')) || [];

/**
 * Funzione per attivare la telecamera e leggere il codice a barre
 */
function avviaScanner() {
    const container = document.getElementById('scanner-container');
    container.style.display = 'block'; // Mostriamo il riquadro video

    Quagga.init({
        inputStream: { name: "Live", type: "LiveStream", target: container },
        decoder: { readers: ["ean_reader"] } // Standard per prodotti alimentari
    }, (err) => {
        if (err) { alert("Errore fotocamera: " + err); return; }
        Quagga.start();
    });

    // Cosa fare quando legge un codice con successo
    Quagga.onDetected((data) => {
        const codice = data.codeResult.code;
        Quagga.stop(); // Spegniamo la camera
        container.style.display = 'none'; // Nascondiamo il riquadro
        cercaSuOpenFoodFacts(codice); // Cerchiamo il nome online
    });
}

/**
 * Cerca il nome del prodotto usando un database online gratuito
 */
async function cercaSuOpenFoodFacts(codice) {
    const inputNome = document.getElementById('cibo');
    inputNome.value = "Sto cercando...";

    try {
        const url = `https://world.openfoodfacts.org/api/v0/product/${codice}.json`;
        
        // Modifichiamo il fetch aggiungendo un "header" di identificazione
        const risposta = await fetch(url, {
            headers: {
                // Sostituisci con il tuo nome o nome app
                'User-Agent': 'MioCongelatoreSmart - Browser - Version 1.0 - Un utente che impara a programmare'
            }
        });
        const dati = await risposta.json();

        if (dati.status === 1) {
            // Se esiste, prendiamo il nome in italiano o quello generico
            inputNome.value = dati.product.product_name_it || dati.product.product_name;
        } else {
            inputNome.value = "";
            alert("Prodotto non trovato. Inseriscilo a mano!");
        }
    } catch (e) {
        alert("Errore di connessione al database prodotti.");
    }
}


/**
 * Aggiunge un elemento con la logica della scadenza
 */
function aggiungiCibo() {
    const nome = document.getElementById('cibo').value;
    const dataInserimento = document.getElementById('data').value;
    const durataMesi = document.getElementById('mesi').value;

    if (!nome || !dataInserimento || !durataMesi) {
        alert("Per favore, compila tutti i campi!");
        return;
    }

    // Creiamo l'oggetto includendo i mesi di durata
    const nuovoItem = {
        nome: nome,
        data: dataInserimento,
        mesi: parseInt(durataMesi)
    };

    inventario.push(nuovoItem);
    salvaEMostra();
    
    // Pulizia campi
    document.getElementById('cibo').value = "";
}

/**
 * Salva i dati, ordina per scadenza e aggiorna la visualizzazione
 */
function salvaEMostra() {
    // 1. Ordiniamo l'array 'inventario' prima di mostrarlo
    inventario.sort((a, b) => {
        // Calcoliamo la data di scadenza per l'oggetto A
        let scadenzaA = new Date(a.data);
        scadenzaA.setMonth(scadenzaA.getMonth() + a.mesi);

        // Calcoliamo la data di scadenza per l'oggetto B
        let scadenzaB = new Date(b.data);
        scadenzaB.setMonth(scadenzaB.getMonth() + b.mesi);

        // Confrontiamo le due date: la più vicina andrà in alto
        return scadenzaA - scadenzaB;
    });

    // 2. Salviamo la lista ordinata nella memoria del browser
    localStorage.setItem('freezer_data', JSON.stringify(inventario));
    
    const listaUl = document.getElementById('listaCibo');
    listaUl.innerHTML = ""; 

    const oggi = new Date();

    // 3. Generiamo la lista visiva (ora sarà ordinata per urgenza!)
    inventario.forEach((item, index) => {
        let dataScadenza = new Date(item.data);
        dataScadenza.setMonth(dataScadenza.getMonth() + item.mesi);

        const millisecondiAlGiorno = 1000 * 60 * 60 * 24;
        const giorniRimanenti = Math.ceil((dataScadenza - oggi) / millisecondiAlGiorno);

        const li = document.createElement('li');
        
        let classeStato = "stato-ok";
        let messaggioScadenza = `Scade tra ${giorniRimanenti} giorni`;

        if (giorniRimanenti <= 0) {
            classeStato = "stato-scaduto";
            messaggioScadenza = "⚠️ SCADUTO / DA USARE SUBITO";
        } else if (giorniRimanenti < 30) {
            classeStato = "stato-attenzione";
            messaggioScadenza = `⏳ Urgente: ${giorniRimanenti} gg`;
        }

        li.className = classeStato;
        li.innerHTML = `
            <div>
                <strong>${item.nome}</strong>
                <span class="data-scadenza">
                    Scadenza: <strong>${dataScadenza.toLocaleDateString()}</strong><br>
                    <small>${messaggioScadenza}</small>
                </span>
            </div>
            <button onclick="elimina(${index})" style="width:auto; background:#ff4444; color:white; padding: 5px 10px;">X</button>
        `;
        listaUl.appendChild(li);
    });
}

function elimina(index) {
    inventario.splice(index, 1);
    salvaEMostra();
}

// Avviamo la visualizzazione al caricamento della pagina
salvaEMostra();