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
        xhr.setRequestHeader("Accept", "application/json; charset=utf-8");
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
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
                responseNotification = document.createElement("div");
                responseNotification.id = id;
                responseNotification.classList.add("notification", "ajax", "is-light", "mt-2", "pt-2", "pb-2", "pl-1", "pr-1");
                setTimeout(() => responseNotification.classList.add("active"), 0);
            }
            responseNotification.classList.add("blink");
            setTimeout(() => responseNotification.classList.remove("blink"), 2000);
            responseNotification.classList.remove("is-success", "is-info", "is-danger", "is-warning");

            if (response.target.status === 0) {
                // unknown error
                responseNotification.classList.add("is-danger");
                responseNotification.innerHTML = "Une erreur inconnue est survenue.";
            } else {
                // success
                const jsonResponse = JSON.parse(response.target.response);
                const classPerType = {
                    "neutral" : "is-light",
                    "success" : "is-success",
                    "info" : "is-info",
                    "warning" : "is-warning",
                    "error" : "is-danger"};
                const iconPerType = {
                    "neutral" : "<i class=\"fas fa-circle\"></i>",
                    "success" : "<i class=\"fas fa-check-circle\"></i>",
                    "info" : "<i class=\"fas fa-info-circle\"></i>",
                    "warning" : "<i class=\"fas fa-exclamation-triangle\"></i>",
                    "error" : "<i class=\"fas fa-times-circle\"></i>"};

                // setting notification content
                responseNotification.classList.add(classPerType[jsonResponse.type]);
                responseNotification.innerHTML = iconPerType[jsonResponse.type] + "&nbsp;&nbsp;" + jsonResponse.message;
                form.appendChild(responseNotification);

                if (typeof jsonResponse.redirect !== "undefined") {
                    setTimeout(() => {
                        window.location.href = jsonResponse.redirect;
                    }, 1000);
                } else if (jsonResponse.refresh) {
                    setTimeout(() => {
                        window.location.reload();
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
