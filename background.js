const _illsUrl   = 'https://raw.githubusercontent.com/Illegal-Services/Illegal_Services/downloads/IS.booksmarks.html'
const _browser   = chrome || browser;
const _folderExp = /^(\s+)<DT><H3.*?>(.*?)<\/H3>\s\1<DL><p>([\s\S]*?)^\1<\/DL><p>/im;
const _lineExp   = /<DT><A (?:.*?HREF="(.*?)")?.*?>(.*?)<\/.*?>/i;
const _extName   = "Illegal Services";

_browser.runtime.onStartup.addListener(createBookmarks);
_browser.runtime.onInstalled.addListener(createBookmarks);

function createSubEntries(workFolder, data, depth=2){
    while (found = _folderExp.exec(data)) {
        data = data.substring(found.index + found[0].length);
        addEntry(workFolder, found[2], found[3], recurse=true, depth);
    }
    while (found = _lineExp.exec(data)) {
        data = data.substring(found.index + found[0].length);
        addEntry(workFolder, found[2], found[1]);
    }
}

function addEntry(destination, name, data=null, recurse, depth=2){
    if (depth < 2) {
        return createSubEntries(destination, data, ++depth);
    }
    name = name.replaceAll('&#39;', "'");
    if (recurse) {
        return _browser.bookmarks.create({'parentId': destination, 'title': name}, (subFolder) => {
            createSubEntries(subFolder.id, data);
        });
    }
    _browser.bookmarks.create({'parentId': destination, 'title': name, 'url': data});
}

function createBookmarks() {
    let _parentId = "1"; // unsafe, might be different
    _browser.bookmarks.search(_extName, (results) => {
        if (results.length){
            _parentId = results[0].parentId;
            _browser.bookmarks.removeTree(results[0].id);
        }
        _browser.bookmarks.create({'parentId': _parentId, 'title': _extName}, (folder) => {
            fetch(_illsUrl)
                .then((response) => {
                    return response.text();
                })
                .then((data) => {
                    createSubEntries(folder.id, data, 0);
                })
                .catch(() => {
                    console.log("Could not complete the request");
                });
        });
    });
}