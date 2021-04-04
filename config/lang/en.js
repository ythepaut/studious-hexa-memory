module.exports = {
    meta: {
        lang: "en",
        description: "Exercice practice application"
    },

    header: {
        practice: "Practice",
        manageExercises: "Manage exercises",
        manageUsers: "Manage accounts",
        more: "More",
        about: "About",
        legal: "Legal",
        hello: "Hello",
        connect: "Sign in",
        lang: "EN",
        modalChangeLanguage: {
            changeLangTitle: "Change language",
            choose: "Change"
        }
    },

    exercise: {
        start: {
            startPractice: {
                letsPractice: "Let's practice",
                numberOfExercises: "Number of exercises",
                numberOfExercisesHint: "Put 0 or leave blank to take as many exercises as possible.<br />\n" +
                    "The practice session will stop manually or once there are no more exercises to do.",
                tags: "Tags",
                exerciseTagMode: {
                    label: "Exercises must include",
                    intersection: "All the tags selected",
                    union: "At least on of the tags selected"
                },
                begin: "Start the practice session"
            },
            recommendations: {
                statsAndRecommendations: "Statistics and recommendations",
                soon: "Soon",
                soonText: "<b>Unavailable at the moment :(</b><br />Follow <b>Studious Hexa Memory</b>'s development on <a href=\"https://github.com/ythepaut/studious-hexa-memory\" target=\"_blank\">GitHub</a> !",
                loginRequired: "<b>Oops !</b> You must be logged in to access this feature."
            }
        },

        exercise: {
            exercise: "Exercise",
            passed: "I passed the exercise",
            notPassed: "I did not passed the exercise",
            revealAnswer: "Reveal the answer",
            exerciseNo: "Exercise n°",
            tagsUsed: "used",
            stopSession: "Stop the practice session"
        },

        end: {
            finished: "End of training !",
            cause: {
                manual: "You stopped the session",
                max: "Exercise goal achieved",
                depleted: "You have done all the exercises with the selected tags"
            },
            stats: {
                title: "Statistics",
                exercisesDone: "Exercises done",
                passRate: "Pass rate"
            },
            summary: {
                title: "Summary",
                table: {
                    number: "N°",
                    title: "Title",
                    tags: "Tags",
                    passed: "Passed"
                },
                yes: "Yes",
                no: "No"
            },
            end: "Quit"
        }
    },

    error: {
        generic: "<b>Oops</b>, an error has occured."
    },

    about: {
        paragraph: "<b>Studious Hexa Memory</b> is a web application whose purpose is to help practicing exercises.\n" +
            "            <br /><br />\n" +
            "            The goal is not to respond to exercises from the site in the form of a MCQ, but rather to make the statement proposed by the exercise within a given time.<br />\n" +
            "            Once this time has elapsed or after completing the exercise, you will be able to see its correction and validate or not your result.\n" +
            "            <br /><br />\n" +
            "            The features of Studious Hexa Memory are developed by <a href=\"https://www.ythepaut.com/\" target=\"_blank\">Yohann THEPAUT</a> and overseen <a href=\"https://www.youtube.com/channel/UCtgWzEBDJy_Jj7J7v2Y39UA\" target=\"_blank\">Baptiste BRUGEROLLE</a>.\n" +
            "            <br /><br />\n" +
            "            Source code available <a href=\"https://github.com/ythepaut/studious-hexa-memory\" target=\"_blank\">GitHub</a> under the GNU GPL v3 license."
    },

    legal: {
        editor: "Editor :",
        host: "Host",
        hostedBy: "The website « ythepaut.com » is hosted by the OVHcloud company."
    }
};
