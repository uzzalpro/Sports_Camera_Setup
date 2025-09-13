# configuration-tool

#### Environment variables

In order to run the project we first have to configure some environment variables by making a .env file or storing them locally:
- CONF_TOOL_DB_URL - URL needed for connecting to the database (_postgresql://username:password@server:port/db_name_).
- STORAGE_ACCOUNT_CONNECTION - Connection string for communicating with the Azure Storage Blob.
- STORAGE_ACCOUNT_CONTAINER - Container name in the Azure Storage Blob used for the project.
- FLASK_HOST - server host for the flask server (localhost or 0.0.0.0)

## Running the project with docker
When running the project through docker containers make sure the server variable in the CONF_TOOL_DB_URL env variable is set to _db_ and the FLASK_HOST variable is set to _0.0.0.0_.
<br><br>

First install and run docker desktop: https://www.docker.com/products/docker-desktop/ 

and Windows Subsystem for Linux (WSL): https://github.com/microsoft/WSL/releases/tag/2.5.7

Then make sure Secure Virtual Machine is enabled on your system. You can check this easily by opening Task Manager and look at the Virtualisation variable under the performance tab. If it's disabled you'll have to enable SVM Mode in the BIOS.


Secondly make sure to have an .env file in the project folder.

We can then open a terminal in the project folder and build the docker containers:
```
docker-compose build
```
And then run the containers:
```
docker-compose up
```

If the backend container doesn't start try building again.

You can also use docker to clear the database if needed:
```
docker-compose down -v
```

## Running the project locally
When running the project locally make sure the server variable in the CONF_TOOL_DB_URL env variable is set to _localhost_ and the FLASK_HOST variable is also set to _localhost_.
<br><br>

### Frontend
This React project uses Vite as its build tool.
Before running the project make sure you have nodejs installed, aswell as the latest version of npm:

- nodejs: https://nodejs.org/en/
- npm: https://docs.npmjs.com/try-the-latest-stable-version-of-npm

After downloading or cloning the project, navigate to the project folder and install the necessary packages, after the installation you can run the project:

```
cd frontend
npm install
npm run dev
```

If you encounter any errors when trying to run the project you might have to use a shorter path or install the Microsoft Visual C++ 2015 Redistributable: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170

### Backend

To get the necessary python libraries used in this project, you can install them from the requirements.txt file using pip install:
```
pip install -r requirements.txt
```

### Database

For this project we are using a PostgreSQL database server. Make sure to install it first: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

During the installation you will have to provide a password for connecting to the server.

You can check the status of the server through Windows Powershell with:

```
Get-Service -Name postgresql*
```
When running Powershell as admin you can stop and start the server with:
```
Stop-Service -Name postgresql*
Start-Service -Name postgresql*
```

Going through postgresql's installation process already makes a default database called __postgres__ which you can use for administrative task like adding other databases. It's best to make a new database for the project and not use the default one. In order to do this you can start the SQL Shell program (included with the earlier postgresql installation) and connect to the default database, then create a new database. Make sure to update the CONF_TOOL_DB_URL environment variable accordingly.

```
CREATE DATABASE db_name;
```

### Starting it up

We need to do three things every time in order to run the project locally:
1. Make sure the db server is running, you can check this with the commands mentioned above.
2. Start the backend through running _python main.py_ while in the backend folder.
3. Start the frontend through running _npm run dev_ while in the frontend folder.

## Replicating the project

This section explains how a base for the project was made from scratch, by installing and using the right tools.


### Frontend

Make sure you have nodejs and npm installed as mentioned in the previous section.

First create a general folder for the whole project (configuration-tool). In this folder create a react folder using the command line (skip this if you already have a project):

```
npm create vite@latest frontend
```

Then follow the prompts; select React and Javascript. Afterwards run _npm install_ to install the necessary packages.

Vite adds a base webpage setup which we won't be needing. We can strip it down in order to start from scratch:

- delete image in the public folder
- delete image in src/assets
- delete App.css
- delete content from index.css
- change title in index.html
- delete content of the App component in App.jsx
=> 
```
function App() {
  return (
    <></>
  )
}

export default App
```

To keep our components organized we can add multiple folders in src like:
- components - for storing different subcomponents used in App.jsx.
- scripts - for storing seperate javascript files.
- styles - for storing css files linked to components.

Since creating a React project with Vite automatically creates a .gitignore file in that folder we have to make some adjustments:

1. Move the .gitignore file to the mainfolder
2. Adjust the frontend paths =>

```
# frontend files

frontend/node_modules
frontend/dist
frontend/dist-ssr
frontend/*.local
```
### Backend

Make a folder called _backend_ in the main project folder, this will contain all of our python scripts.

We're going to use a virtual environment for organization purposes and managing dependencies.
Create a virtual environment in the backend folder and activate it:

```
python -m venv backend/venv
backend/venv/Scripts/activate
```
If venv doesn't create its own gitignore then don't forget to add the venv folder to the .gitignore file =>
```
# backend files

backend/venv
```

We can make multiple folders in the backend to keep everything organized:
- data_classes - contains the class table definitions of every table in the database using the sqlalchemy.orm structure. Also contains models, parsers, init, setattr and getattr functions for each class.
- api - contains all the api route functions of the different classes.
- database - contains simple files to test db communication (_db_connection_test.py_, _db_fetch_test.py_ and _db_insert_test.py_). Also contains more important db files for starting a session (_session.py_) and building the db tables (_db_setup.py_).


### Database

Make sure to install postgresql and create a database as mentioned in the previous section.

By running the _backend/database/db_connection_test.py_ script you can test the connection with de database via the SQLAlchemy library, make sure to install it first, aswell as the psycopg2 library for PostgreSQL support:
```
pip install sqlalchemy
pip install psycopg2
```

By running the _backend/database/db_setup.py_ you can create all the necessary tables and their columns for the project.

<br>
<br>

---
Versions used:

- python: 3.13.2
- pip: 25.0.1
- nodejs: 22.13.1
- npm: 11.1.0
- postgresql: 17.4.1

For python libraries see backend/requirements.txt.