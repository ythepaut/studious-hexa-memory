// elements
const btnSeeResponse = document.querySelector("#btnSeeResponse");
const btnExerciseFail = document.querySelector("#btnExerciseFail");
const btnExerciseSuccess = document.querySelector("#btnExerciseSuccess");
const divNextButtons = document.querySelector("#divNextButtons");
const divResponse = document.querySelector("#divResponse");
const divStatement = document.querySelector("#divStatement");
const progressTimer = document.querySelector("#progressTimer");
const labelTimer = document.querySelector("#labelTimer");
const divTimer = document.querySelector("#divTimer");

let timer = null;

// handle see response button
const revealResponse = () => {
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
    postRequest("/", "success=" + success);
}
btnExerciseFail.addEventListener("click", (event) => {
    nextExercise(false);
});
btnExerciseSuccess.addEventListener("click", (event) => {
    nextExercise(true);
});

// handle timer and progress bar when document loaded
let time = -1;
document.addEventListener("DOMContentLoaded", (event) => {
    time = progressTimer.value;
    timer = setInterval(() => {

        if (time > 0) {
            time--;
            progressTimer.value = time;
            labelTimer.innerHTML = formatTime(Math.floor(time/100));
        } else {
            revealResponse();
        }

    }, 10);


    // formats latex
    divStatement.innerHTML = formatLatexImage(divStatement.innerHTML);
    divResponse.innerHTML = formatLatexImage(divResponse.innerHTML);
});

// handles stop practice button
btnExerciseSuccess.addEventListener("click", (event) => {
    postRequest("/", "end=true");
});
