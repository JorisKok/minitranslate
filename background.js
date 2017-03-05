
chrome.runtime.onMessage.addListener(handleMessage);

// Initialize the database via localStorageDB
var dictionary = new localStorageDB("dictionary", localStorage);

// Check if the database was just created. Useful for initial database setup
if(dictionary.isNew()) {
    initiateDatabase();
}

// The local storage defaults, set default to true
chrome.storage.sync.get("active", function (result) {
    if (typeof result["active"] === "undefined") {
        chrome.storage.sync.set({"active": true});
    }
});

chrome.storage.sync.get("amount", function (result) {
    if (typeof result["amount"] === "undefined") {
        chrome.storage.sync.set({"amount": 5});
    }
});

function initiateDatabase() {

    // Required to do it via ajax
    getRequest('db/cedict_1_0_ts_utf-8_mdbg.txt', function (result) {

        dictionary.createTable("items", ["traditional", "simplified", "pinyin", "english"]);

        var lines = result.split("\n");
        var pattern = /(.+?) (.+?) (\[.+\]) \/(.+)\//i;
        var matches = null;

        for (var i = 0; i < lines.length; i++) {
            if (lines[i][0] !== "#") {
                matches = lines[i].match(pattern);

                dictionary.insert("items", {
                    traditional: matches[1],
                    simplified: matches[2],
                    pinyin: matches[3],
                    english: matches[4]
                });
            }
        }

        // All create/drop/insert/update/delete operations should be committed
        dictionary.commit();

    }, function (error) {
        alert(error);
    });

}

// TODO temporary fix, because it removes the initiated db somehow?
if (dictionary.tableCount() == 0) {
    initiateDatabase();
}

function handleMessage (request, sender, sendResponse) {

    var searchWord = searchWordOptimization(request);

    // TODO improve the search function a bit
    var result = dictionary.queryAll("items", {
        query: function (row) {
            if (row.english.indexOf(searchWord) !== -1) {

                return true;
            }

            return false;
        }
    });

    if (result == null) {

        return; // TODO or sendResponse with the original word (request) back?
    }

    sendResponse(wordSelection(result, searchWord));

}

// Vanilla Ajax
function getRequest(url, success, error) {
    var req = false;
    try{
        // most browsers
        req = new XMLHttpRequest();
    } catch (e){

        return false;
    }
    if (!req) {

        return false;
    }
    if (typeof success != 'function') success = function () {};
    if (typeof error!= 'function') error = function () {};

    req.onreadystatechange = function(){
        if(req .readyState == 4){

            return req.status === 200 ?
                success(req.responseText) : error(req.status)
            ;
        }
    };
    req.open("GET", url, true);
    req.send(null);

    return req;
}