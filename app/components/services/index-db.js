angular.module("web").factory("indexDBSvs", [
  "$q",
  function ($q) {
    return {
      open: open,
      create: create,
      update: update,
      list: list,
      get: get,
      delete: del,
      clear: clear,
    };
    /**
      initStore: {storeName: }
      */
    function open(name, version, initStoreMap) {
      var df = $q.defer();
      var version = version || 1;
      var request = window.indexedDB.open(name, version);
      request.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      request.onsuccess = function (e) {
        var db = e.target.result;
        df.resolve(db);
      };
      request.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (initStoreMap) {
          for (var storeName in initStoreMap) {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(
                storeName,
                initStoreMap[storeName] || {
                  keyPath: "id",
                  autoIncrement: true,
                }
              );
              //db.createObjectStore(storeName, {keyPath: 'id', utoIncrement: true});
            }
          }
        }
        console.log("DB version changed to " + version);
      };
      return df.promise;
    }
    function list(db, storeName) {
      var df = $q.defer();
      var transaction = db.transaction(storeName, "readwrite");
      var store = transaction.objectStore(storeName);
      var cursor = store.openCursor();
      var data = [];
      cursor.onsuccess = function (e) {
        var result = e.target.result;
        if (result && result !== null) {
          data.push(result.value);
          result.continue();
        } else {
          df.resolve(data);
        }
      };
      cursor.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      return df.promise;
    }

    function get(db, storeName, key) {
      var df = $q.defer();
      var transaction = db.transaction(storeName, "readwrite");
      var store = transaction.objectStore(storeName);
      var request = store.get(key);
      request.onsuccess = function (e) {
        var item = e.target.result;
        df.resolve(item);
      };
      request.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      return df.promise;
    }
    function create(db, storeName, data) {
      var df = $q.defer();
      var transaction = db.transaction(storeName, "readwrite");
      var store = transaction.objectStore(storeName);
      var request = store.add(data);
      request.onsuccess = function (e) {
        df.resolve();
      };
      request.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      return df.promise;
    }
    function update(db, storeName, key, data) {
      var df = $q.defer();
      var transaction = db.transaction(storeName, "readwrite");
      var store = transaction.objectStore(storeName);
      var request = store.get(key);
      request.onsuccess = function (e) {
        var item = e.target.result;
        if (item) {
          angular.extend(item, data);
          store.put(item);
        } else {
          store.add(data);
        }
        df.resolve();
      };
      request.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      return df.promise;
    }

    function del(db, storeName, key) {
      var df = $q.defer();
      var transaction = db.transaction(storeName, "readwrite");
      var store = transaction.objectStore(storeName);
      var request = store.delete(key);
      request.onsuccess = function (e) {
        df.resolve();
      };
      request.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      return df.promise;
    }
    function clear(db, storeName, key) {
      var df = $q.defer();
      var transaction = db.transaction(storeName, "readwrite");
      var store = transaction.objectStore(storeName);
      var request = store.clear();
      request.onsuccess = function (e) {
        df.resolve();
      };
      request.onerror = function (e) {
        console.error(e.currentTarget.error.message);
        df.reject(e.currentTarget.error);
      };
      return df.promise;
    }
  },
]);
