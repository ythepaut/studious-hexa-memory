// elements
const btnSeeResponse = document.querySelector("#btnSeeResponse");
const btnExerciseFail = document.querySelector("#btnExerciseFail");
const btnExerciseSuccess = document.querySelector("#btnExerciseSuccess");
const divSkipButton = document.querySelector("#divSkipButton");
const divNextButtons = document.querySelector("#divNextButtons");
const divResponse = document.querySelector("#divResponse");
const progressTimer = document.querySelector("#progressTimer");
const labelTimer = document.querySelector("#labelTimer");
const divTimer = document.querySelector("#divTimer");

let timer = null;

// handle see response button
const revealResponse = () => {
    divSkipButton.classList.add("is-hidden");
    divTimer.classList.add("is-hidden");
    divNextButtons.classList.remove("is-hidden");
    divResponse.classList.remove("is-hidden");
    if (timer != null) {
        clearInterval(timer);
        timer = null;
    }
}
btnSeeResponse.addEventListener("click", (event) => {
    revealResponse();
});

// handle next exercise button
const nextExercise = (success) => {
    let request = new XMLHttpRequest();
    request.open("POST", "/", true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            location.reload();
        }
    };
    request.send("success=" + success);
}
btnExerciseFail.addEventListener("click", (event) => {
    nextExercise(false);
});
btnExerciseSuccess.addEventListener("click", (event) => {
    nextExercise(false);
});

// handle timer and progress bar when document loaded
let time = -1;
document.addEventListener("DOMContentLoaded", (event) => {
    time = progressTimer.value;
    timer = setInterval(() => {

        if (time > 0) {
            time--;
            progressTimer.value = time;
            labelTimer.innerHTML = Math.floor(time/100).toString();
        } else {
            revealResponse();
        }

    }, 10);
});
