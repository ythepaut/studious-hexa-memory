document.querySelectorAll("[data-toggle=modal]").forEach((toggleElement) => {
    toggleElement.addEventListener("click", (event) => {
        event.preventDefault();
        let modal = document.querySelector("#" + toggleElement.getAttribute("data-target"));
        modal.classList.add("is-active");
    });
});
document.querySelectorAll(".modal-close, div.modal-background").forEach((toggleElement) => {
    toggleElement.addEventListener("click", (event) => {
        event.preventDefault();
        let modal = document.querySelector("#" + toggleElement.getAttribute("data-target"));
        modal.classList.remove("is-active");
    });
});
