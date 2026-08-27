Below are prerequisites, step-by-step, and troubleshooting instructions
for installing the LAS 1 Data Routing System for Model Families project.
The project is designed for two functions. First, process a batch of
audio files to receive their plaintext translation, and second, to
display all metadata collected while processing each batch.

# Prerequisites {#prerequisites .unnumbered}

Before running the application, ensure you have the following installed
on your system:

-   **[Git**](https://git-scm.com/): Ensure Git is
    > installed for cloning the repository.

-   [**[Docker & Docker
    > Compose]{.underline}**](https://docs.docker.com/get-started/get-docker/):
    > Install Docker and Docker Compose if not already installed. (For
    > Linux, I'd recommend just installing the docker engine and not
    > docker desktop)

-   **AWS Credentials for S3 Access**: You must have AWS credentials
    > configured to access the S3 bucket.

    -   Set up an AWS account if you don't have one.

    -   Create an S3 bucket and note down its name.

    -   Save AWS credentials (needed later in the installation).

# Installation Steps {#installation-steps .unnumbered}

## Clone the Repository

cd \<desired project_directory\>



****git clone
https://github.ncsu.edu/engr-csc-sdc/2025Spring-Team20-LAS-1.git



## Initialize environment variables

> Before starting the project, you need to configure the environment
> variables.

a.  Copy the Example Environment File in the Root directory

cp .env.example .env



b.  Move into the dashboard directory

cd 2025Spring-Team20-LAS-1/dashboard



c.  Copy the Example Environment File:

cp .env.example .env

d.  Ensure both .env files have corresponding environment variables and
    > update the field "DB_USERNAME, DB_PASSWORD, and DB_ROOT_PASSWORD:

**Root .env**

DASH_PORT=3000

\# DB.

DB_CONNECTION=mysql

\# This should match the Database Service Name in the docker-compose.yml

DB_HOST=db

\# This is your Local port (pick an open port), the Database container
will open 3306 always

DB_PORT=3306

\# Name of the Database to store information

DB_DATABASE=DataRoutingDB

DB_USERNAME=root \# will change in prod for admin access.

DB_PASSWORD=your_password_here \# any password doesn\'t matter locally
(but does in prod).

DB_ROOT_PASSWORD=your_root_password_here

\# Redis.

REDIS_PORT=6379

REDIS_HOST=redis

REDIS_PASSWORD=password

\# Whisper Endpoint

API_ENDPOINT_PORT=5000

**Dashboard .env**

# Dashboard accessible env.

\# App.

NEXT_PUBLIC_APP_NAME=\"LAS Router\"

NEXT_PUBLIC_APP_FULL_NAME=\"Data Router System for Model Families\"

NEXT_PUBLIC_APP_ENV=development

NEXT_PUBLIC_APP_URL=http://host.docker.internal:3000

NEXT_PUBLIC_APP_VERSION=0.0.1

\# Reports.

NEXT_PUBLIC_REPORTS_DATA_SOURCE=\"DataRoutingDB.mariadb\"

\# DB.

DB_CONNECTION=mysql

DB_HOST=db

DB_PORT=3306

DB_DATABASE=DataRoutingDB

DB_USERNAME=root \# will change in prod for admin access.

DB_PASSWORD=password \# any password doesn\'t matter locally (but does
in prod).

\# AWS S3 Bucket.

AWS_ACCESS_KEY_ID=\"\"

AWS_SECRET_ACCESS_KEY=\"\"

AWS_REGION=\"us-east-1\"

AWS_BUCKET_NAME=\"las.senior-design-spring2025-datarouting\"

\# Redis.

REDIS_PORT=6379

REDIS_HOST=redis

REDIS_PASSWORD=password

\# Whisper.

API_ENDPOINT_PORT=5000



For debugging purposes in the future, I am going to go over the
docker-compose.yml file here to help explain what is happening in the
next step. If you are familiar with compose files feel free to skip
ahead.

**Services:**

-   **Frontend**

    -   Builds the frontend using the dashboard directory where a
        > Dockerfile (This Dockerfile is responsible for creating the
        > Image the container runs off of, which essentially means
        > installing dependencies, copying over needed code, and
        > starting the dashboard up) is located and names this container
        > dashboard.

    -   Then it maps the local port specified in the .env to the
        > container port 3000, this is where the dashboard will be
        > displayed.

    -   This container requires the database to be "healthy"
        > (connectable & running) and the redis container to be running.

    -   Profiles section is only used with docker compose to know what
        > services you want started, built, etc.

        -   This can be specified via:

        -   docker compose \--profile \<profile\> \<option: \[build, up,
            > down, etc.\]\>

frontend:

build: ./dashboard

container_name: dashboard

ports:

\- \"\${DASH_PORT}:3000\"

depends_on:

db:

condition: service_healthy

redis:

condition: service_started

profiles:

\- frontend

\- \"\"



-   **Backend**

    -   Uses pipe directory to build container (location of pipe
        > Dockerfile)

    -   Names the container pipe

    -   The stdin_open & tty options were added to ease the "exec"
        > (attachment) process (this will be shown with the -it flags
        > later)

    -   Environment sets environment variables inside the container:

        -   PYTHONPATH is set for pytest (unit testing)

        -   DB\_\*: These are set to establish a DB connection

            -   **Note**: The DB_PORT reflects the port of the database
                > container, which will always be 3306, if you should
                > need to connect to another database not on port 3306
                > update this accordingly and make sure the .env files
                > reflect this.

    -   Volumes: creates a shared volume between the local pipe
        > directory and the /app (root container directory) very useful
        > for updating python files locally and seeing active changes in
        > the container.

    -   Depends on the database to be healthy (See the healthcheck in db
        > for more info)

backend:

build: ./pipe

container_name: pipe

stdin_open: true

tty: true

environment:

PYTHONPATH: /app

DB_HOST: \${DB_HOST}

DB_PORT: \"3306\"

DB_USERNAME: \${DB_USERNAME}

DB_PASSWORD: \${DB_PASSWORD}

DB_DATABASE: \${DB_DATABASE}

volumes:

\- ./pipe:/app

depends_on:

db:

condition: service_healthy

profiles:

\- backend

\- \"\"



-   **DB**

    -   Uses the mariadb:lts image off of Docker Hub as base image
        > (instead of a local Dockerfile as seen before)

    -   Creates a container names mariadb (if there are conflicting
        > containers locally you may have to adjust this)

    -   The restart: always option helps ensure the database setups
        > correctly in case of crashes or shutting down the container.
        > It forces the healthcheck to run which will make sure the
        > database can be connected too.

    -   Maps the local port to the container port.

    -   Volumes: the first is a sql script to run when the volume is
        > first created, however, it is outdated and should be removed
        > in the future. The second is a shared volume to save the
        > database data so the database does not clear.

    -   Environment: All of these environment variables are special
        > because docker will set up this in the database for us.
        > They'll set a root password to the environment variable we
        > give it. Create a database with the name given. Create a user
        > and password that only has permissions on the database just
        > created.

    -   Healthcheck: Is how docker determines the mariadb container is
        > healthy, which is used by other services. This check runs a
        > provided script to make sure the database can be connected to.

db:

image: mariadb:lts

container_name: mariadb

restart: always

ports:

\- \"\${DB_PORT}:3306\"

volumes:

\- ./init.sql:/docker-entrypoint-initdb.d/init.sql

\- mariadb_data:/var/lib/mysql

environment:

MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD}

MYSQL_DATABASE: \${DB_DATABASE}

MYSQL_USER: \${DB_USERNAME}

MYSQL_PASSWORD: \${DB_PASSWORD}

healthcheck:

test: \[\"CMD\", \"healthcheck.sh\", \"\--connect\",
\"\--innodb_initialized\"\]

start_period: 10s

interval: 10s

timeout: 5s

retries: 3

profiles:

\- frontend

\- backend

\- database

\- \"\"



-   **Whisper**

    -   Builds a Whisper container using the large-v3-turbo model to
        > serve as a dummy subtask model in development. If this
        > container is no longer needed the code can be removed.

    -   It is accessed by the other containers by hitting
        > [http://whisper:5000/transcribe](http://whisper:5000/transcribe)
        > and providing the file to be transcribed.

whisper:

build: ./pipe/Whisper

container_name: whisper

stdin_open: true

tty: true

ports:

\- \${API_ENDPOINT_PORT}:5000

profiles:

\- whisper

\- \"\"



-   **Redis**

    -   Used by the frontend to cache items for faster performance.

redis:

image: redis:latest

container_name: redis

ports:

\- \"\${REDIS_PORT}:6379\"

environment:

\# - REDIS_USERNAME=\${REDIS_USERNAME}

\- REDIS_PASSWORD=\${REDIS_PASSWORD}

command: /bin/sh -c \"redis-server \--requirepass \$\$REDIS_PASSWORD\"

restart: always

profiles:

\- redis

\- \"\"



## Build and Start the Application

> Run the following command to build the Docker images and start the
> application:

docker compose up \--build -d

This command will:

-   Build the necessary Docker images.

-   Install all required dependencies inside the containers.

-   Start the application with all required services.

## Verify the Installation

Once the application is running, you can check if it's working correctly
by:

-   Checking the logs with:

docker compose logs -f

-   The dashboard can be displayed at URL:
    > [localhost](https://locallhost/):3000

## Stopping the Application

> To stop the running containers, use:

docker compose down

> This will shut down all services without removing built images.

## Cleaning Up

If you need to remove all built images and volumes, run:

docker compose down \--volumes \--rmi all

# **Troubleshooting**  {#troubleshooting .unnumbered}

-   Common mistakes:

    -   Ensure Docker Desktop is running

    -   ...

-   Ensure Docker services are running properly: systemctl status docker

-   If there are dependency issues, ensure the requirements.txt is
    > correctly defined in the Dockerfile.

If you are a **user** of this system please refer to
[**[LAS 1 - User
Guide]{.underline}**](https://docs.google.com/document/u/0/d/1FA5GTBvmAbug2NHXVpoc1rztdasph31qYMsmA5ws108/edit)
for further instructions on using this project

If you are a **developer** of this system please refer to
[**[LAS 1 - Developer
Guide]{.underline}**](https://docs.google.com/document/u/0/d/10ERLp1R4gWAnlxtXoUVrZuUxPwB4PCHDT_Slo8JsgGk/edit)
for further information on working with the codebase.
