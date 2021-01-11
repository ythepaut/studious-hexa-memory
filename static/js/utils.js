/**
 * Returns str as html elements from [image] and $Latex$
 * @param {string}              str             Raw statement/response to transform
 * @param {boolean}             formatLatex     True to render latex
 * @param {boolean}             formatImage     True to render images
 * @return {string}                             HTML elements
 */
function formatLatexImage(str, formatLatex = true, formatImage = true) {
    // LateX
    if (formatLatex) {
        str = str.replace(/\$(.*?)\$/g, (a, b) => {
            b = b.replace(/&lt;/g, "<");
            b = b.replace(/&gt;/g, ">");
            return katex.renderToString(b, {
                throwOnError: false
            });
        });
    }
    // Image
    if (formatImage) {
        str = str.replace(/\[\[(.*?)\]\]/g, (a, b) => {
            b.replace("\"", "\\\"");
            return "<img src=\"" + b + "\" alt=\"" + b + "\" />";
        });
    }
    // New line
    str = str.replace(/\n/g, "<br />");

    return str;
}

/**
 * Adds a preview to a textarea to format latex and images
 * @param {object}              input           Element to listen to, and translate value
 * @param {object}              preview         Element to write transformed value
 * @param {boolean}             formatLatex     True to render latex
 * @param {boolean}             formatImage     True to render images
 */
function addPreviewUpdate(input, preview, formatLatex, formatImage) {
    preview.innerHTML = formatLatexImage(input.value, formatLatex, formatImage);
    input.addEventListener("keyup", () => {
        preview.innerHTML = formatLatexImage(input.value, formatLatex, formatImage);
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
 * @param {function}            callback        Callback fct : callback(response)
 */
function postRequest(url, body, callback) {
    let request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            callback(this.responseText);
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
