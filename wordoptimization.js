function searchWordOptimization (word) {

    // If we want to support more languages, change it here

    // Remove -ly etc if it contains that etc for each language to get the base of the word
    // Countries to Country etc
    // Happily to Happy etc

    // English Plural
    // Source: http://users.monash.edu/~damian/papers/HTML/Plurals.html

    var result = [];
    result.push(word); // Always added!

    result.push(word.replace(/(\w+?)(as|ae|ata)\b/, "$2a"));

    result.push(word.replace(/(\w+?)en\b/, "$1an"));

    result.push(word.replace(/(\w+?)ches\b/, "$ch"));

    result.push(word.replace(/(\w+?)(eaus|eaux)\b/, "$1eau"));

    result.push(word.replace(/(\w+?)(ens|ina)\b/, "$1en"));

    result.push(word.replace(/(\w+?)(exes|ices)\b/, "$1ex"));

    result.push(word.replace(/(\w+?)ves\b/, "$1f"));
    result.push(word.replace(/(\w+?)ves\b/, "$1fe"));

    result.push(word.replace(/(\w+?)(ieus|ieux)\b/, "$1ieus"));

    result.push(word.replace(/(\w+?)(es|ises|ides)\b/, "$1is"));

    result.push(word.replace(/(\w+?)(ixes|ices)\b/, "$1ix"));

    result.push(word.replace(/(\w+?)(nxes|nges)\b/, "$1nx"));

    result.push(word.replace(/(\w+?)(oes|os|i)\b/, "$1o"));

    result.push(word.replace(/(\w+?)(ons|a)\b/, "$1on"));

    result.push(word.replace(/(\w+?)(oofs|ooves)\b/, "$1oof"));

    result.push(word.replace(/(\w+?)ses\b/, "$1s"));

    result.push(word.replace(/(\w+?)shes\b/, "$1sh"));

    result.push(word.replace(/(\w+?)(a|ums)\b/, "$1um"));

    result.push(word.replace(/(\w+?)(era|i|uses|ora|us)\b/, "$1us"));

    result.push(word.replace(/(\w+?)xes\b/, "$1x"));

    result.push(word.replace(/(\w+?)ies\b/, "$1y"));

    result.push(word.replace(/(\w+?)zoa\b/, "$1zoon"));

    result.push(word.replace(/(\w+?)(s|im)\b/, "$1")); // Is this one necessary?

    result.push(word.replace(/(\w+?)ee(\w+)/, "$1oo$2")); // foot -> feet, tooth, teeth

    // End plural

    // -ly
    result.push(word.replace(/(\w+?)ly/, "$1"));

    // Remove all duplicates
    return result.filter(function (item, pos) {return result.indexOf(item) == pos});
}

// Returns a sorted array from the selected array
// Later we might show the first three or so additional meanings, as in Chinese there might be alternative correct ones
function wordSortation (dictionary, itemArray, searchWords) {

    // Give each word a value
    // If the Hanzi is short, that is better
    // If the English is short, that is better
    // If it matches correctly or between / it is good
    var compare = function (entry) {

        var count = 0;

        switch (entry["traditional"].length) {
            case 0:
                count += 0;
                break;
            case 1:
                count += 15;
                break;
            case 2:
                count += 36;
                break;
            case 3:
                count += 50;
                break;
            case 4:
                count += 60;
                break;
            default:
                count += 70;
        }

        switch (entry["english"].split("/").length) {
            case 0:
                count += 0;
                break;
            case 1:
                count += 0;
                break;
            case 2:
                count += 2;
                break;
            case 3:
                count += 4;
                break;
            case 4:
                count += 8;
                break;
            case 5:
                count += 14;
                break;
            default:
                count += 20;
        }

        for (var i = 0; i < searchWords.length; i++) {

            /**
             *  The order is based on this scheme
             *  popular
                popular/something
                something/popular/something
                something/something/popular

                popular something/something
                something/popular something/something
                something/something/popular something
                something/something/something popular
                popularly
             */

            if (entry["english"] === searchWords[i]) {

                count = 0;
                continue;
            }

            var r1 = new RegExp("[^\/]\b"+ searchWords[i] +"\/");
            if (r1.test(entry["english"])) {

                count -= 15;
                break;
            }

            var r2 = new RegExp("\/" + searchWords[i] + "\/");
            if (r2.test(entry["english"])) {

                count -= 13;
                break;
            }

            var r3 = new RegExp("\/" + searchWords[i] + "\b[^ \w]");
            if (r3.test(entry["english"])) {

                count -= 11;
                break;
            }

            var r4 = new RegExp("[^\/]\b" + searchWords[i] + "\b ");
            if (r4.test(entry["english"])) {

                count -= 9;
                break;
            }

            var r5 = new RegExp("\/\b" + searchWords[i] + "\b .+?(?=\/)");
            if (r5.test(entry["english"])) {

                count -= 7;
                break;
            }

            var r6 = new RegExp("\/\b" + searchWords[i] + "\b .+?");
            if (r6.test(entry["english"])) {

                count -= 5;
                break;
            }

            var r7 = new RegExp("\b" + searchWords[i] + "\b");
            if (r7.test(entry["english"])) {

                count -= 3;
                break;
            }
        }

        return count;
    };


    itemArray.sort(function (a, b) {
        // The English text in the dict is split by /, so match a full string on it
        // Order: Just the word.
        if (compare(a) > compare(b)) {

            return 1;
        }

        return -1;
    });
    
    return searchWordRelevancy(dictionary, itemArray.slice(0,5), searchWords);
}

// Search each possible word in the database to check for the occurrences and relevancy
function searchWordRelevancy (dictionary, itemArray, searchWords) {

    // Double search here, but couldn't find a way to do it directly within the query...
    var result = dictionary.queryAll("items", {
        query: function (row) {
            for (var i = 0; i < itemArray.length; i++) {
                if (row.traditional.indexOf(itemArray[i]["traditional"]) !== -1) {

                    return true
                }
            }

            return false;
        }
    });

    // Check if the traditional occurrences and then check if the english search word is in it
    for (var r = 0; r < result.length; r++) {
        for (var i = 0; i < itemArray.length; i++) {
            if (result[r]["traditional"].indexOf(itemArray[i]["traditional"]) !== -1) {
                for (var s = 0; s < searchWords.length; s++) {
                    if (result[r]["english"].indexOf(searchWords[s]) !== -1) {
                        if (typeof itemArray[i]["relevance"] !== "undefined") {

                            itemArray[i]["relevance"]++;
                        } else {

                            itemArray[i]["relevance"] = 0;
                        }
                    }
                }
            }
        }
    }

    itemArray.sort(function (a, b) {
        if (a["relevance"] > b["relevance"]) {

            return -1;
        }

        return 1;
    });

    return itemArray;
}
