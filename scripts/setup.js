import { storageGet, storageSet, setVersion, checkVersion } from './helper.js'

storageGet("initialized")
    .then((initialized) => {
        if (!initialized) {
            storageSet("version", "0.0.0.0")
                .then(()=>{
                    setVersion();
                    storageSet("initialized", true);
                });
        } else {
            checkVersion();
        }
    });
