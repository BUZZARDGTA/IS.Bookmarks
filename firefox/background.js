browser.runtime.onStartup.addListener(createBookmarks);
browser.runtime.onInstalled.addListener(createBookmarks);

function createSubEntries(workFolder, data, depth=2){
    while (found = /^(\s+)<DT><H3.*?>(.*?)<\/H3>\s\1<DL><p>([\s\S]*?)^\1<\/DL><p>/im.exec(data)) {
        data = data.substring(found.index + found[0].length);
        addEntry(workFolder, found[2], found[3], recurse=true, depth);
    }
    while (found = /<DT><A (?:.*?HREF="(.*?)")?.*?>(.*?)<\/.*?>/i.exec(data)) {
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
        return browser.bookmarks.create({'parentId': destination, 'title': name}, (subFolder) => {
            createSubEntries(subFolder.id, data);
        });
    }
    browser.bookmarks.create({'parentId': destination, 'title': name, 'url': data});
}

function createBookmarks() {
    let _parentId = "1"; // unsafe, might be different
    browser.bookmarks.search("Illegal Services", (results) => {
        if (results.length){
            _parentId = results[0].parentId;
            browser.bookmarks.removeTree(results[0].id);
        }
        browser.bookmarks.create({'parentId': _parentId, 'title': "Illegal Services"}, (folder) => {
            fetch('IS.bookmarks.html')
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