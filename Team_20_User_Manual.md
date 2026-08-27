# **User Guide**

Depending on

## **Prerequisites**

Before running the batches of audio files, ensure you have the following
completed:

-   [**[LAS 1 - Deployment
    > Guide]{.underline}**](https://docs.google.com/document/d/1iMZ-qe13M7HF9Z92N2XEZ8Ed5-7YFfeyinzkXcpU_pg/edit?usp=drive_link)
    > is fully installed and working on local machine

-   AWS credentials and s3 bucket name (From LAS 1 - Installation Guide)

-   Audio Files & Ground Truth (if applicable) need to be uploaded to
    > the S3 bucket

    -   The filename for ground truth should match the audio filename
        > but with a .txt extension instead.

    -   **Note**: Currently, the benchmark flag is not being set in the
        > pipeline, which means the frontend will not reflect batches as
        > being marked a benchmark. This means a total WER for the
        > entire batch is not calculated and displayed, however, a WER
        > is displayed on the file and subtask level. During
        > implementation we chose an approach to avoid an argument or
        > config to specify a benchmark run, and instead to look at
        > ground truth, if it exists we can perform our calculations and
        > if not we will continue as if it is a production batch. (See
        > [[developers
        > guide]{.underline}](https://docs.google.com/document/d/10ERLp1R4gWAnlxtXoUVrZuUxPwB4PCHDT_Slo8JsgGk/edit?usp=drive_link)
        > for more info)

-   Setup Config File:

    -   If a config.json does not exist in the pipe directory, run

cd pipe

cp config.json.example config.json



-   Then configure the following values:

    -   csv_path: Path to .csv file containing filenames (Reference
        > path.csv for an example)

    -   bucket_name: Name of the S3 bucket used to establish connection

    -   model_path: Path to trained model to use in Audio Classifier

    -   aws_access_key_id: Public Key

    -   aws_secret_access_key: Private Key

    -   subtask_models: A map of endpoints corresponding to a cluster
        > (e.g. "0" is cluster 0, and the API Endpoint is the subtask
        > model for that cluster)

{

\"csv_path\": \"./paths.csv\",

\"bucket_name\": \"las.senior-design-spring2025-datarouting\",

\"model_path\": \"/app/DataClassifier/model/trained_model.joblib\",

\"aws_access_key_id\": \"INSERT_PUBLIC_KEY\",

\"aws_secret_access_key\": \"INSERT_PRIVATE_KEY\"

\"subtask_models\": {

\"0\": \"INSERT_API_ENDPOINT\"

\"1\": \"INSERT_API_ENDPOINT\"

\"2\": \"INSERT_API_ENDPOINT\"

\"3\": \"INSERT_API_ENDPOINT\"

\"4\": \"INSERT_API_ENDPOINT\"

}

}



-   Run the Pipe Docker Container or Ensure it is running (from the root
    > directory, not pipe):

    -   To check if it is running:

docker ps



-   There should be a container listed "pipe"

-   If not run the following:

docker compose up backend -d \--build

-   This will start the pipe and database

There are two functionalities of this system.

1.  Process a batch of audio files to be translated into plaintext of
    > the speech in the file.

2.  View metadata of individual or aggregated batches of audio files

Below will detail the process to complete and navigate through each
functionality.

## **Process Files (Pipe)**

1.  Prerequisites (See top of page)

2.  Setup audio files (csv file)

    a.  Insert the desired audio files in a csv file following the
        > format establish in paths.csv (If you are using a different
        > file other paths.csv you'll need to update this in the
        > config.json)

3.  Attach to the Container

    a.  We need to jump into the pipe to run it via the CLI, run the
        > following:

docker exec -it pipe bash

b.  This will attach us to the "pipe" in a bash session

```{=html}
<!-- -->
```
4.  Run command (CLI)

    a.  The pipe links the local pipe directory and the contents of the
        > container, so any changes locally will be reflected in the
        > container.

    b.  If the Database has never been established you'll need to run
        > the initialization script:

python DB_Util/init_db.py



c.  You'll should get a success message in the console

d.  Now it is time to run the pipe and actually process audio files:

python main.py -c config.json



e.  Now you'll see the Pipe in action, the first run may be slower
    > because some python packages will pull up to date versions.

f.  There should be a loading bar that says "Processing File" that gives
    > the current file being processed and the time it has taken so far.

## 

## **Visualize Data OR View Dashboard (Dashboard)**

1.  Prerequisites

2.  Process Files (Pipe)

    a.  The Dashboard currently does not support an empty database, so
        > it is paramount that a batch is run through the pipe before
        > opening up the dashboard.

3.  Navigate to dashboard

    a.  Ensure the dashboard container is running:

docker ps



b.  Make sure there is a container called Dashboard, if not run:

docker compose up frontend -d \--build



c.  You should see the frontend container start up, as well as the
    > database & redis.

d.  The dashboard will be running locally on the port 3000:

    i.  [http://localhost:3000](http://localhost:3000)

e.  See Troubleshooting (Bottom of page if there is an issue)

```{=html}
<!-- -->
```
4.  Overview

    a.  You'll be greeted by an Overview page, where the most recent
        > batch is selected.

        i.  There is a drop down on the top right to select batches
            > based on timestamp.

    b.  There is an "Aggregate" section which shows the aggregated stats
        > of the selected batches.

    c.  Beneath the Aggregate section is the table containing the
        > specific files included in the selected batches:

        i.  This table is fully customizable to show or hide specific
            > columns depending on what you are interested in viewing.

5.  Visualization

    a.  Next to the "Overview" tab, you'll see a tab labelled
        > "Visualization". Clicking this will take you to the
        > Visualization page.

    b.  For the time being, there is only one visualization displayed:
        > the Sankey Routing Chart.

        i.  This shows the distribution of files to individual models,
            > and the associated WER if applicable.

    c.  There are other charts, but as of hand off they are not shown in
        > the Dashboard. (See [[developers
        > guide]{.underline}](https://docs.google.com/document/d/10ERLp1R4gWAnlxtXoUVrZuUxPwB4PCHDT_Slo8JsgGk/edit?usp=drive_link))

6.  Export

    a.  Next to the Batch drop down, you'll see an export icon (Page
        > with Arrow Leaving it), select this.

    b.  Exporting takes a few seconds as the data is being gathered and
        > formatted into a PDF for download, this involves several steps
        > and for the best experience it is recommended not to navigate
        > away from the page as it is loading.

    c.  After completing, you'll see a report generated based on the
        > currently selected batches, the current columns being
        > displayed in the overview table, and charts on the
        > visualization page.

        i.  **Note:** If the Overview table is displaying a lot of
            > columns the report will not be able to show them all
            > because of limited space, recommended to only select the
            > most relevant columns for the report.

## 

## 

## 

## 

## 

## 

## 

## 

## 

## 

## 

## **Troubleshooting**

### Both

-   An easy place for things to go wrong is the .env file. In production
    > when all containers are running the "\*\_HOST" variables should
    > match the service names in the docker-compose.yml file. Docker
    > will handle resolving this service name to the container and
    > establish the connection. If you are running any service locally
    > instead of using a container you'll need to update these to
    > localhost. (This will be documented more in the [[deployment
    > guide]{.underline}](https://docs.google.com/document/u/0/d/1iMZ-qe13M7HF9Z92N2XEZ8Ed5-7YFfeyinzkXcpU_pg/edit),
    > as hopefully it is a one and done issue)

-   Always ensure the container is running:

docker ps

-   Starting all containers can be done using:

docker compose up -d \--build

-   The logs of any container can be viewed and they'll give the
    > console output of the containers start up, this oftentimes can
    > provide useful information:

docker logs \<container_name or container_id\>

-   If for some reason you are noticing that your system is not updated
    > to match the most recent development changes there are a few
    > solutions guaranteed to work:

    -   Fresh Build (No Caching)

docker compose build \<optional: service name\> \--no-cache

-   Removing Old Images, Containers, Volumes

    -   If Docker Desktop is available it is recommended to use this.

    -   Stop, then delete the container if applicable.

    -   Then go to the images and remove the corresponding image.

    -   **Warning**: The following step is about deleting the database
        > volume and all information will be lost.

    -   Navigate to the volumes tab and delete the corresponding volume.

    -   Using the cmd line it'll look like this:

\[View running containers: docker ps\]

docker stop \<container_name or container_id\>

docker rm \<container_name or container_id\>

\[View all images: docker images\]

docker rmi \<image_name\>

\[View all volumes: docker volume ls\]

docker volume rm \<volume_name\>



### Pipe

-   Ensure the config.json is correct.

-   Ensure the environment variables are correct.

-   Known Issue:

    -   Ground Truth Error in CLI for production files. Issue was
        > discovered too close to the deadline, but does not affect
        > functionality of the project. (See [[developers
        > guide]{.underline}](https://docs.google.com/document/u/0/d/10ERLp1R4gWAnlxtXoUVrZuUxPwB4PCHDT_Slo8JsgGk/edit)
        > for fixes)

### Dashboard

-   Ensure the environment variables are correct.

-   Known Issues:

    -   If the database is empty the dashboard will not display.

        -   Fix: Populate the database (Consult [[developers
            > guide]{.underline}](https://docs.google.com/document/d/10ERLp1R4gWAnlxtXoUVrZuUxPwB4PCHDT_Slo8JsgGk/edit?usp=drive_link)
            > for fixing this issue)

    -   Ground Truth Error when clicking Ground Truth Icon for
        > production files. Issue was discovered too close to the
        > deadline, but does not affect functionality of the project.
        > (See [[developers
        > guide]{.underline}](https://docs.google.com/document/u/0/d/10ERLp1R4gWAnlxtXoUVrZuUxPwB4PCHDT_Slo8JsgGk/edit)
        > for fixes)

    -   A last minute issue believed to be resolved now was related to
        > the export page. During development the frontend was
        > implemented locally which was mostly a smooth transition into
        > running inside a docker container, however, we did run into
        > some problems with the export functional. The key issue is
        > that it relies on a headless browser to load html and generate
        > a pdf, but without some configuration a docker container does
        > not have all the needed dependencies for this.
