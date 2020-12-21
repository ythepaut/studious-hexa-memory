/**
 * Returns str as html elements from [image] and $Latex$
 * @param {string}              str             Raw statement/response to transform
 * @return {string}                             HTML elements
 */
function formatLatexImage(str) {
    str = str.replaceAll(/\$(.*)\$/g, "<img src=\"https://latex.codecogs.com/png.latex?$1\" alt=\"$1\" />");
    str = str.replaceAll(/\[(.*)\]/g, "<img src=\"$1\" alt=\"$1\" />");
    str = str.replaceAll(/\n/g, "<br />");
    return str;
}

/**
 * Adds a preview to a textarea to format latex and images
 * @param {object}              input           Element to listen to, and translate value
 * @param {object}              preview         Element to write transformed value
 */
function addPreviewUpdate(input, preview) {
    preview.innerHTML = formatLatexImage(input.value);
    input.addEventListener("keyup", (event) => {
        preview.innerHTML = formatLatexImage(input.value);
    });
}

/**
 * Translate secondes to readable time
 * @param {number}              s               Time in secondes
 * @return {string}                             Readable time (HH:MM:SS)
 */
function formatTime(s) {
    let h = Math.trunc(s / 3600);
    s -= h*3600;
    let m = Math.trunc(s / 60);
    s -= m*60;
    return ("00"+h).substr(("00"+h).length-2) + ":" +
        ("00"+m).substr(("00"+m).length-2) + ":" +
        ("00"+s).substr(("00"+s).length-2);
}

/**
 * Sends a post request to url
 * @param {string}              url             Target url
 * @param {string}              body            Params of POST request
 */
function postRequest(url, body) {
    let request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            location.reload()
        }
    };
    request.send(body);
}


/**
 * @see https://github.com/ythepaut/info305_ki-oui/blob/a64ead58c43946d208ae52c3d916dd162ce3357b/js/index.js#L280
 */
function searchEvent() {
    for (let inse of document.querySelectorAll(".search-input")) {
        inse.addEventListener("keyup", function() {
            searchTable(inse.getAttribute("data-target"), inse.value);
        })
    }
}
function searchTable(tableId, searchQuery) {
    for (let row of document.querySelectorAll("#" + tableId + " tr")) {
        if (row.innerHTML.includes(searchQuery) || row.innerHTML.includes('th style')) {
            row.removeAttribute("style");
        } else {
            row.setAttribute("style", "display: none;");
        }
    }
}
