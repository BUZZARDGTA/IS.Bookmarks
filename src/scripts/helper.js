const _versionUrl = "https://pastebin.com/raw/JB0xvJRG";
const _bookmarkUrl = "https://raw.githubusercontent.com/Illegal-Services/Illegal_Services/downloads/IS.bookmarks.html";
const _versionRegex = /v(\d+).(\d+).(\d+).(\d+) - (\d+\/\d+\/\d+)/;
var _browser = chrome || browser;
var updateList = [];



async function createSubEntries(workFolder, data, depth=2) {
    var index = 0;
    while (found = /^(\s+)<DT><H3.*?>(.*?)<\/H3>\s\1<DL><p>([\s\S]*?)^\1<\/DL><p>/im.exec(data)) {
        data = data.substring(found.index + found[0].length);
        addEntry(workFolder, found[2], found[3], true, depth, index);
        index++;
    }
    while (found = /<DT><A (?:.*?HREF="(.*?)")?.*?>(.*?)<\/.*?>/i.exec(data)) {
        data = data.substring(found.index + found[0].length);
        addEntry(workFolder, found[2], found[1], false, 2, index);
        index++;
    }
}

async function addEntry(destination, name, data=null, recurse, depth=2, index) {
    if (depth < 2) {
        createSubEntries(destination, data, ++depth);
        return;
    }
    name = name.replaceAll('&#39;', "'");
    if (recurse) {
        _browser.bookmarks.create({'parentId': destination, 'title': name, 'index': index}, (subFolder) => {
            updateList.push([subFolder.id, index]);
            createSubEntries(subFolder.id, data);
        });
        return;
    }
    _browser.bookmarks.create({'parentId': destination, 'title': name, 'url': data, 'index': index}, (subFolder) => {
        updateList.push([subFolder.id, index]);
    });
}

function createBookmarks(parentId, data, successCallback) {
    _browser.bookmarks.create({'parentId': parentId, 'title': "Illegal Services"}, (folder) => {
        createSubEntries(folder.id, data, 0);
        setTimeout(() => {
            updateList.forEach((item) => {
                _browser.bookmarks.move(item[0], {'index': item[1]})
            });
        }, 400);
        setTimeout(() => {
            updateList.forEach((item) => {
                _browser.bookmarks.move(item[0], {'index': item[1]})
            });
            successCallback();
        }, 500);
    });
}

function updateBookmarks(data, successCallback) {
    _browser.bookmarks.search({"title": "Illegal Services"}, (results) => {
        for (result of results) {
            _browser.bookmarks.removeTree(result.id);
        };
        // dispatch firefox to search for "toolbar_____"
        if (typeof browser !== "undefined") {
            createBookmarks("toolbar_____", data, successCallback);
        }
        else
        {
            createBookmarks("1", data, successCallback);
        }
    });
}

function fetchUrl(url, callback, failCallback=()=>null) {
    fetch(url)
        .then((response) => {
            if (response.ok)
                return response.text();
            else
                throw new Error("Failed to fetch resource");
        })
        .then((data) => {
            callback(data);
        })
        .catch((e) => {
            console.log(e);
            failCallback();
        });
}

function checkVersion(successCallback=()=>null, failCallback=()=>null) {
    fetchUrl(_versionUrl, (data) => {
        [, ...versionNew] = _versionRegex.exec(data);
        dateNew = versionNew.pop();
        versionNew = versionNew.map(x => parseInt(x));

        _storageApi.get("version")
            .then((versionOld) => {
                versionOld = versionOld.split(".").map(x => parseInt(x));
                var performUpdate = () => {
                    fetchUrl(_bookmarkUrl, (data) => {
                        updateBookmarks(data, () => {
                            _storageApi.set("version", versionNew.join("."));
                            successCallback();
                        });
                    }, failCallback);
                };
                if (versionOld < versionNew) {
                    performUpdate();
                } else {
                    _browser.bookmarks.search({"title": "Illegal Services"}, (results) => {
                        if (results.length) {
                            successCallback();
                            return;
                        } else {
                            performUpdate();
                        }
                    });
                }
            })
    });
}

function setVersion() {
    fetchUrl(_versionUrl, (data) => {
        [, ...version] = _versionRegex.exec(data);
        date = version.pop();
        fetchUrl(_bookmarkUrl, (data) => {
            updateBookmarks(data, () => {
                _storageApi.set("version", version.join("."));
            });
        })
    });
}

if (typeof browser !== "undefined") {
    var _storageApi = {
        'get': (item) => {
            return new Promise(function(resolve, reject) {
                resolve(window.localStorage.getItem(item));
            });
        },
        'set': (item, value) => {
            return new Promise(function(resolve, reject) {
                window.localStorage.setItem(item, value);
                resolve();
            });
        }
    }
} else {
    var _storageApi = {
        'get': (item) => {
            return new Promise(function(resolve, reject) {
                chrome.storage.local.get(item, (data) => {
                    if (chrome.runtime.lastError)
                        reject();
                    else
                        resolve(data[item]);
                });
            });
        },
        'set': (key, value) => {
            return new Promise(function(resolve, reject) {
                temp = {}
                temp[key] = value
                chrome.storage.local.set(temp, () => {
                    if (chrome.runtime.lastError)
                        reject();
                    else
                        resolve();
                });
            });
        }
    }
}

_storageApi.get("initialized")
    .then((initialized) => {
        if (!initialized) {
            _storageApi.set("version", "0.0.0.0")
                .then(()=>{
                    setVersion();
                    _browser.runtime.onStartup.addListener(checkVersion);
                    _storageApi.set("initialized", true);
                });
        }
    });


