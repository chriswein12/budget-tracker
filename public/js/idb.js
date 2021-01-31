let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_financial_transactions', { autoIncrement: true });
};

request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_financial_transactions'], 'readwrite');

    // access the object store for `new_financial_transactions`
    const transactionObjectStore = transaction.objectStore('new_financial_transactions');

    // add record to your store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_financial_transactions'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.objectStore('new_financial_transactions');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
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
              // open one more transaction
              const transaction = db.transaction(['new_financial_transactions'], 'readwrite');
              // access the new_financial_transactions object store
              const transactionObjectStore = transaction.objectStore('new_financial_transactions');
              // clear all items in your store
              transactionObjectStore.clear();
    
              alert('All saved transactions have been submitted!');
            })
            .catch(err => {
              console.log(err);
            });
        }
      };
}

window.addEventListener('online', uploadTransaction);