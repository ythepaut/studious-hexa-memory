document.querySelectorAll("form.ajax").forEach((form) => {
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const xhr = new XMLHttpRequest();
        const url = form.getAttribute("action");

        // getting form data
        let data = {};
        for (let i = 0 ; i < form.length ; ++i) {
            let input = form[i];
            if (input.name) {
                data[input.name] = input.value;
            }
        }

        // sending post request
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Accept', 'application/json; charset=utf-8');
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));

        // button loading animation
        form.querySelectorAll("button[type=submit]").forEach((button) => {
            button.classList.add("is-loading");
        });
        // clearing password fields
        form.querySelectorAll("input[type=password]").forEach((input) => {
            input.value = "";
        });
        // setting input disable state
        form.querySelectorAll("input,button").forEach((input) => {
            input.setAttribute("disabled", "disabled");
        });

        // response received
        xhr.onloadend = (response) => {

            // getting / creating notification
            const id = url + form.length; // unique id for notification div
            let responseNotification = document.getElementById(id);
            if (responseNotification === null) {
                responseNotification = document.createElement("div")
                responseNotification.id = id;
                responseNotification.classList.add("notification", "is-light", "mt-2", "pt-2", "pb-2", "pl-1", "pr-1");
            }
            responseNotification.classList.remove("is-success", "is-info", "is-danger");

            if (response.target.status === 0) {
                // unknown error
                responseNotification.classList.add("is-danger");
                responseNotification.innerHTML = "Une erreur inconnue est survenue.";
            } else {
                // success
                const jsonResponse = JSON.parse(response.target.response);
                const classPerType = {"success" : "is-success", "info" : "is-info", "error" : "is-danger"};
                const iconPerType = {"success" : "<i class=\"fas fa-check-circle\"></i>", "info" : "<i class=\"fas fa-info-circle\"></i>", "error" : "<i class=\"fas fa-exclamation-triangle\"></i>"};

                // setting notification content
                responseNotification.classList.add(classPerType[jsonResponse.type]);
                responseNotification.innerHTML = iconPerType[jsonResponse.type] + "&nbsp;&nbsp;" + jsonResponse.message;
                form.appendChild(responseNotification);

                if (jsonResponse.redirect !== undefined) {
                    setTimeout(() => {
                        window.location.href = jsonResponse.redirect;
                    }, 1000);
                } else {
                    // reset input disable state
                    form.querySelectorAll("input,button").forEach((input) => {
                        input.removeAttribute("disabled");
                    });

                    // reset button loading animation
                    form.querySelectorAll("button[type=submit]").forEach((button) => {
                        button.classList.remove("is-loading");
                    });
                }
            }
        };
    });
});
