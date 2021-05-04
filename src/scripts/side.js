import { storageGet, checkVersion } from './helper.js'

var _versionContainer = document.getElementById("version");

function updateVersionString() {
    storageGet("version")
        .then((version) => {
            if (version == "0.0.0.0")
                _versionContainer.innerText = "Network Error";
            else
                _versionContainer.innerText = "IS v" + version;
        });
}

updateVersionString();

var _button = document.getElementById('refresh');
_button.onclick = () => {
    _button.className = "btn btn-secondary w-50 disabled";
    _button.onclick = ()=>null;
    checkVersion(() => {
        updateVersionString();
        _button.innerText = "DONE";
        _button.className = "btn btn-success w-50 disabled";
    }, () => {
        _button.innerText = "FAIL";
        _button.className = "btn btn-danger w-50 disabled";
    });
};
