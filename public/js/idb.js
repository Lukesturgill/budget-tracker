const { request } = require("express");

const database;

// Connect to IndexedDB
const connect = indexedDB.open('budget_tracker', 1);

connect.onupgradeneeded = function(event) {
    const database = event.target.result;

    database.createObjectStore('new_transaction', { autoIncrement: true });
};

connect.onsuccess = function(event) {
    database = event.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
};

connect.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveTransaction(record) {
    const transaction = database.transaction(['new_transaction'], 'readwrite');
    
    const storeBudget = transaction.objectStore('new_transaction');
    
    storeBudget.add(record);
};

function loadTransaction() {
    const transaction = database.transaction(['new_transaction'], 'readwrite');

    const storeBudget = transaction.objectStore('new_transaction');

    const showAll = storeBudget.getAll();

    showAll.onsuccess = function () {

        if (showAll.result.length > 0) {
            fetch('/models/transaction', {
                method: 'POST',
                body: JSON.stringify(showAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = database.transaction(['new_transaction'], 'readwrite');

                const storeBudget = transaction.objectStore('new_transaction');

                storeBudget.clear();

                alert('Saved transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};