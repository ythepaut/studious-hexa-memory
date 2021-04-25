<p align="center">
    <img src="src/static/assets/img/logo.png" alt="STUDIOUS HEXA MEMORY"/>
</p>

[![Workflow](https://img.shields.io/github/workflow/status/ythepaut/studious-hexa-memory/Test%20and%20Deployment/master?style=for-the-badge)](#)
[![Code quality (Codacy)](https://img.shields.io/codacy/grade/fdfcd58cd54447bcbcbba4aea72d9836?style=for-the-badge)](https://app.codacy.com/gh/ythepaut/studious-hexa-memory/dashboard)
[![License](https://img.shields.io/github/license/ythepaut/studious-hexa-memory?style=for-the-badge)](https://github.com/ythepaut/studious-hexa-memory/blob/master/LICENSE)
[![Demo website](https://img.shields.io/website?down_color=red&down_message=Offline&label=Demo%20website&style=for-the-badge&up_color=green&up_message=Online&url=https%3A%2F%2Fstudious-hexa-memory.demo.ythepaut.com%2F)](https://studious-hexa-memory.demo.ythepaut.com/)

**:arrow_down: [English version below](#english) :arrow_down:**

## A propos

Studious Hexa Memomry est une application web, utilisant les technologies NodeJS et MongoDB,
qui permet de s'entraîner sur une banque d'exercices.

Serveur de démonstration : https://studious-hexa-memory.demo.ythepaut.com/


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
   ou en créant un fichier `.env` à partir du fichier `.env.sample` à la racine du projet.

      

   Liste des variables :
   ```
   # Port du serveur (80 par défaut)
   STUDIOUSHEXAMEMORY_SERVER_PORT=80
   
   # Type d'environment (e.g. "production", "dev", "test")
   STUDIOUSHEXAMEMORY_ENVIRONMENT=production
   
   # URI de connexion MongoDB (cf. https://docs.mongodb.com/manual/reference/connection-string/)
   STUDIOUSHEXAMEMORY_MONGODB_URI=mongodb://<NOM D'UTILISATEUR>:<MOT DE PASSE>@localhost:27017/studious_hexa_memory
   
   # Chaîne aléatoire pour le stockage des sessions
   STUDIOUSHEXAMEMORY_SESSION_SECRET=<CHAINE DE CARACTERES SECRETE>
   ```

6. Installer Process Manager 2 (execution du serveur en arrière plan)

   ```$ npm install pm2 -g```

7. Lancer le serveur

   ```$ pm2 start app.js --name studious_hexa_memory```


## Mise à jour d'une instance

1. Récupérer les modifications du répertoire

   ```$ git pull origin master```

2. Installer les éventuelles nouvelles dépendances

   ```$ npm install```

3. Redémarrer l'instance

   ```$ pm2 restart studious_hexa_memory```

** **

# English


## About

Studious Hexa Memomry is a web app that uses NodeJS and MongoDB.
Its goal is to help people to study exercises and auto-evaluate themselves.

Demonstration server : https://studious-hexa-memory.demo.ythepaut.com/


## Deploy an instance

1. Install NodeJS and MongoDB

   ```$ sudo apt-get install nodejs mongodb``` for Debian-based linux distributions

2. Clone this repository

   ```$ git clone https://github.com/ythepaut/studious-hexa-memory.git```

3. Install the dependencies

   ```$ cd studious-hexa-memory```

   ```$ npm install```

4. Database configuration

    * Access MongoDB's CLI

      `$ mongo`

    * Create a collection called `exercises` in the database `studious_hexa_memory`

      `> use studious_hexa_memory`

      `> db.createCollection("exercises")`

    * Check that the database, and the collection were created

      `> show dbs`

      `> show collections`

    * Create an admin user for the database `studious_hexa_memory`

      ```
      > db.createUser({
         user: "<USERNAME>",
         pwd: "<PASSWORD>",
         roles: [
             {role: "dbAdmin", db: "studious_hexa_memory"}
         ]
      })
      ```

    * Exit MongoDB's CLI

      `> exit`


5. Add the environment variables with `$ setenv KEY=VALUE`
   or create a `.env` at the root folder of the project.

   Environment variable list :
   ```
   # Port on which the server runs on (80 by default)
   STUDIOUSHEXAMEMORY_SERVER_PORT=80
   
   # Environment type (e.g. "production", "dev", "test")
   STUDIOUSHEXAMEMORY_ENVIRONMENT=production
   
   # Mongo database URI (see https://docs.mongodb.com/manual/reference/connection-string/)
   STUDIOUSHEXAMEMORY_MONGODB_URI=mongodb://<USERNAME>:<PASSWORD>@localhost:27017/studious_hexa_memory
   
   # Random string for session storage
   STUDIOUSHEXAMEMORY_SESSION_SECRET=<SECRET STRING>
   ```

6. Install Process Manager 2

   ```$ npm install pm2 -g```

7. Start the server

   ```$ pm2 start app.js --name studious_hexa_memory```


## Update an instance

1. Recover the updated files from the repository

   ```$ git pull origin master```

2. Install any new dependencies

   ```$ npm install```

3. Restart the server

   ```$ pm2 restart studious_hexa_memory```
