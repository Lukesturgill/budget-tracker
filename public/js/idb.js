let database;

// Connect to IndexedDB, set to version 1
const connect = indexedDB.open('budget_tracker', 1);

connect.onupgradeneeded = function(event) {
    // save a reference to the database
    const database = event.target.result;
    // create an object store (table) called 'new_transaction' set with auto incrementing primary keys
    database.createObjectStore('new_transaction', { autoIncrement: true });
};

connect.onsuccess = function(event) {
    database = event.target.result;

    // check if app is online, run the loadTransaction() function
    if (navigator.onLine) {
        loadTransaction();
    }
};

connect.onerror = function(event) {
    console.log(event.target.errorCode);
};

// Runs saveTransaction() function if a new transaction is submitted while user is offline
function saveTransaction(record) {
    const transaction = database.transaction(['new_transaction'], 'readwrite');
    
    const storeBudget = transaction.objectStore('new_transaction');
    
    storeBudget.add(record);
};

function loadTransaction() {

    // Open a transaction
    const transaction = database.transaction(['new_transaction'], 'readwrite');
    
    // access users object store
    const storeBudget = transaction.objectStore('new_transaction');
    
    // get all records from store
    const showAll = storeBudget.getAll();

    showAll.onsuccess = function () {

        // Send any store data in indexedDb to api server
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
                
                // open another transaction
                const transaction = database.transaction(['new_transaction'], 'readwrite');

                // access the new transaction stored
                const storeBudget = transaction.objectStore('new_transaction');

                // Clear the stored budget
                storeBudget.clear();

                alert('Saved transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// listen for app coming back online
window.addEventListener('online', loadTransaction);