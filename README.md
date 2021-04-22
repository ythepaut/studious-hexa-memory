<p align="center">
    <img src="static/assets/img/logo.png" />
</p>

![Workflow](https://img.shields.io/github/workflow/status/ythepaut/studious-hexa-memory/Deployment?style=for-the-badge)
![Code quality (Codacy)](https://img.shields.io/codacy/grade/fdfcd58cd54447bcbcbba4aea72d9836?style=for-the-badge)
![License](https://img.shields.io/github/license/ythepaut/studious-hexa-memory?style=for-the-badge)
[![Demo website](https://img.shields.io/website?down_color=red&down_message=Offline&label=Demo%20website&style=for-the-badge&up_color=green&up_message=Online&url=https%3A%2F%2Fstudious-hexa-memory.demo.ythepaut.com%2F)](https://studious-hexa-memory.demo.ythepaut.com/)

**:arrow_down: [English version below](#english) :arrow_down:**

## A propos

Studious Hexa Memomry est une application web, utilisant les technologies NodeJS et MongoDB,
qui permet de s'entraîner sur une banque d'exercices.

Serveur de démonstration : https://studious-hexa-memory.demo.ythepaut.com/

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

** **

# English


## About

Studious Hexa Memomry is a web app that uses NodeJS and MongoDB.
Its goal is to help people to study exercises and auto-evaluate themselves.

Demonstration server : https://studious-hexa-memory.demo.ythepaut.com/

***

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
   STUDIOUSHEXAMEMORY_SERVER_PORT=80
   STUDIOUSHEXAMEMORY_MONGODB_USER=<USERNAME>
   STUDIOUSHEXAMEMORY_MONGODB_PASSWORD=<PASSWORD>
   STUDIOUSHEXAMEMORY_SESSION_SECRET=<SECRET_STRING>
   ```

6. Install Process Manager 2

   ```$ npm install pm2 -g```

7. Start the server

   ```$ pm2 start app.js --name studious_hexa_memory```

***

## Update an instance

1. Recover the updated files from the repository

   ```$ git pull origin master```

2. Install any new dependencies

   ```$ npm install```

3. Restart the server

   ```$ pm2 restart studious_hexa_memory```
