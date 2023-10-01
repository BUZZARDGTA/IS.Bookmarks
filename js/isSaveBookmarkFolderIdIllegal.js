export { isSaveBookmarkFolderIdIllegal };


function isSaveBookmarkFolderIdIllegal(bookmarkFolderId) {
    const illegalIds = ["tags________"];

    return illegalIds.includes(bookmarkFolderId);
}
