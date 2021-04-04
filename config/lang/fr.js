module.exports = {
    meta: {
        lang: "fr",
        description: "Application de révisions"
    },

    header: {
        practice: "S'entraîner",
        manageExercises: "Gérer les exercices",
        manageUsers: "Gérer les comptes",
        more: "Plus",
        about: "A propos",
        legal: "Mentions légales",
        hello: "Bonjour",
        connect: "Se connecter",
        lang: "FR",
        modalChangeLanguage: {
            changeLangTitle: "Changer la langue",
            choose: "Changer"
        }
    },

    exercise: {
        start: {
            startPractice: {
                letsPractice: "Commencer des exercices",
                numberOfExercises: "Nombre d'exercices",
                numberOfExercisesHint: "Saisir 0 ou laisser vide pour ne pas limiter le nombre d'exercices.<br />\n" +
                    "L'entraînement se finira lorsque vous l’arrêterez manuellement, ou alors quand il n'y aura plus d'exercice.",
                tags: "Tags",
                exerciseTagMode: {
                    label: "Les exercices de mon entraînement doivent inclure",
                    intersection: "Tous les tags sélectionnés ci-dessus",
                    union: "Au moins un des tags sélectionnés ci-dessus"
                },
                begin: "Commencer l'entraînement"
            },
            recommendations: {
                statsAndRecommendations: "Statistiques et recommandations",
                soon: "Prochainement",
                soonText: "<b>Fonctionnalité indisponible :(</b><br />Suivez le développement de <b>Studious Hexa Memory</b> sur <a href=\"https://github.com/ythepaut/studious-hexa-memory\" target=\"_blank\">GitHub</a> !",
                loginRequired: "<b>Oups !</b> Vous devez être connecté pour avoir accès à cette fonctionnalité."
            }
        },

        exercise: {
            exercise: "Exercice",
            passed: "J'ai réussi l'exercice",
            notPassed: "Je n'ai pas réussi l'exercice",
            revealAnswer: "Voir la réponse",
            exerciseNo: "Exercice n°",
            tagsUsed: "de l'entraînement",
            stopSession: "Arrêter mon entraînement"
        },

        end: {
            finished: "Fin de l'entraînement !",
            cause: {
                manual: "Vous avez arrêté les exercices",
                max: "Objectif d'exercices atteint",
                depleted: "Vous avez fait tous les exercices des tags sélectionnés"
            },
            stats: {
                title: "Statistiques",
                exercisesDone: "Nombre d'exercices effectués",
                passRate: "Pourcentage de réussite"
            },
            summary: {
                title: "Résumé",
                table: {
                    number: "N°",
                    title: "Titre",
                    tags: "Tags",
                    passed: "Réussi"
                },
                yes: "Oui",
                no: "Non"
            },
            end: "Terminer"
        }
    },

    error: {
        generic: "<b>Oups</b>, une erreur est survenue."
    },

    about: {
        paragraph: "<b>Studious Hexa Memory</b> est un site d’entraînement et de révision sur des exercices proposés par ses utilisateurs.\n" +
            "            <br /><br />\n" +
            "            Le but n’est pas de répondre aux exercices depuis le site sous la forme d’un QCM, mais plutôt de faire l’énoncé proposé par l’exercice dans un temps imparti.<br />\n" +
            "            Une fois ce temps écoulé ou après avoir fini l’exercice, vous pourrez consulter sa correction et valider ou non votre résultat.\n" +
            "            <br /><br />\n" +
            "            Les fonctionnalités de Studious Hexa Memory sont développées par <a href=\"https://www.ythepaut.com/\" target=\"_blank\">Yohann THEPAUT</a> et supervisées par <a href=\"https://www.youtube.com/channel/UCtgWzEBDJy_Jj7J7v2Y39UA\" target=\"_blank\">Baptiste BRUGEROLLE</a>.\n" +
            "            <br /><br />\n" +
            "            Code source disponible sur <a href=\"https://github.com/ythepaut/studious-hexa-memory\" target=\"_blank\">GitHub</a> sous licence GNU GPL v3."
    },

    legal: {
        editor: "Editeur du site internet « ythepaut.com » :",
        host: "Hebergeur",
        hostedBy: "Le site « ythepaut.com » est hébergé par la société OVHcloud."
    }
};
