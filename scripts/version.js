import { getAddonVersion } from './helper.js'

var version_span = document.getElementById('addon_version');
version_span.innerText = "v" + getAddonVersion();
