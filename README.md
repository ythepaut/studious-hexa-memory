# Studious Hexa Memory

[![CodeFactor](https://www.codefactor.io/repository/github/ythepaut/studious-hexa-memory/badge/master)](https://www.codefactor.io/repository/github/ythepaut/studious-hexa-memory/overview/master)
[![Known Vulnerabilities](https://snyk.io/test/github/ythepaut/studious-hexa-memory/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ythepaut/studious-hexa-memory?targetFile=package.json)

## A propos

Studious Hexa Memomry est une application web, utilisant les technologies NodeJS et MongoDB,
qui permet de s'entraîner sur un banque d'exercices.

Serveur de démonstration : https://demo.studious-hexa-memory.ythepaut.com/

***

## Déploiement d'une instance

1. Installer NodeJS et MongoDB
   
   ```$ sudo apt-get install nodejs mongodb``` sur les distributions dérivées de Debian

2. Cloner ce répertoire

   ```$ git clone https://github.com/ythepaut/studious-hexa-memory.git```

3. Installer les dépendances
   
   ```$ cd studious-hexa-memory```
   
   ```$ npm install```

4. Configuration de la base de données

   * Accéder à la CLI de MongoDB 
     
     `$ mongo`

   * Créer un collection `exercises` dans la base `studious_hexa_memory`

     `> use studious_hexa_memory`
     
     `> db.createCollection("exercises")`
     
   * Vérifier que la base et la collection ont été créées

     `> show dbs`

     `> show collections`

   * Créer un utilisateur avec les droits sur la base `studious_hexa_memory`

     ```
     > db.createUser({
        user: "<NOM D'UTILISATEUR>",
        pwd: "<MOT DE PASSE>",
        roles: [
            {role: "dbAdmin", db: "studious_hexa_memory"}
        ]
     })
     ```
     
   * Quitter la CLI MongoDB
    
     `> exit`
    

5. Ajouter les variables d'environnement avec la commande `$ setenv CLÉ=VALEUR`
   ou en créant un fichier `.env` à la racine du projet.
   
   Liste des variables :
   ```
   STUDIOUSHEXAMEMORY_SERVER_PORT=80
   STUDIOUSHEXAMEMORY_MONGODB_USER=<NOM D'UTILISATEUR>
   STUDIOUSHEXAMEMORY_MONGODB_PASSWORD=<MOT DE PASSE>
   STUDIOUSHEXAMEMORY_SESSION_SECRET=<CHAINE DE CARACTERES SECRETE>
   ```

6. Installer Process Manager 2 (execution du serveur en arrière plan)

   ```$ npm install pm2 -g```

7. Lancer le serveur

   ```$ pm2 start app.js --name studious_hexa_memory```

***

## Mise à jour d'une instance

1. Récupérer les modifications du répertoire

   ```$ git pull origin master```

2. Installer les éventuelles nouvelles dépendances

   ```$ npm install```

3. Redémarrer l'instance

   ```$ pm2 restart studious_hexa_memory```
