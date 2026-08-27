# **Frontend Developer Guide**

## **Project Overview**

The frontend component of this system is a modern, responsive dashboard
built using the Next.js framework with TypeScript. This dashboard plays
a crucial role in the LAS Data Routing System, allowing researchers to
visualize and evaluate the performance of a modular pipeline that routes
audio files to specialized speech-to-text (STT) models.

Designed with usability in mind, the dashboard connects to a MariaDB
backend and provides key functionalities such as

-   View batch-level processing metrics

-   Analyze word error rates and routing accuracy

-   Export performance reports (PDF/Excel)

-   Compare base vs subtask STT models

The application is built on top of React 18 with server-side rendering
and leverages data visualization libraries such as Recharts, d3-sankey,
and \@visx/visx to present insights in a clear and interactive manner.

The dashboard was developed to support LAS researchers in comparing
performance between a general STT model (e.g., Whisper V3) and a routing
model that utilizes fine-tuned subtask models for different accents or
dialects. The visual insights provided through this interface help users
determine whether subtask routing offers a meaningful performance
benefit in terms of word error rate and computational efficiency.

## **Directory Structure**

The dashboard/ directory contains the Next.js 15 application that
visualizes system results.

**Main Files and Folders:**

-   .env and .env.example: Dashboard-specific environment settings
    > (important: reference the development setup to initialize your
    > unique to system local env).

-   Dockerfile: Build configuration for containerized deployment.

-   package.json, tsconfig.json: Dependency and typescript configuration
    > files.

-   tailwind.config.ts, postcss.config.mjs: Styling configurations for
    > TailwindCSS integration.

**Subdirectories:**

-   config/:\
    > Stores app configuration settings (e.g., Redis configuration, S3
    > connections, report templates). Use this instead of interacting
    > with .env vars directly (e.g. provides fall back if not set).

-   public/:\
    > Static assets including logos and icons.

-   src/app/:\
    > Main application logic and pages:

    -   (pages)/: Overview and visualization pages.

    -   (report-templates)/: Components for generating downloadable PDF
        > reports.

    -   actions/: Server-side database queries (e.g., fetching batches,
        > overview stats).

    -   api/: Server endpoints for PDF report generation.

    -   components/:

        -   overviewPage/: components specific to the overview page of
            > the app.

        -   visualizationPage/: components specific to the visualization
            > page of the app.

        -   reusable/: Modular frontend UI components including charts,
            > tables, dropdowns, and navigation made to be used by any
            > other component. \*Building blocks to create custom use
            > case components.

        -   beta/: Components which have been base completed but still
            > need touch up.

    -   constants/:\
        > Defines routing and application-wide constants. This for ease
        > of plug-n-play of pages. No additional code needed.

    -   lib/:\
        > Utility functions and database connection helpers.

    -   models/:\
        > Type definitions for application objects such as batches,
        > classifications, input processor, etc.

    -   store/:\
        > Global state management for batches and tables using in-memory
        > stores.

    -   types/:\
        > Application-wide TypeScript type definitions.

## **Development Setup**

The frontend of the LAS dashboard is developed using **Next.js (v15)**
with TypeScript. It follows the App Router structure and uses
**Turbopack** during development for fast builds. Styling is handled
using **Tailwind CSS**, and **Zustand** is used for lightweight global
state management. The project integrates powerful data visualization
tools including **Recharts**, **d3-sankey**, and **\@visx/visx**.
Iconography and accessible UI elements are implemented using
**\@heroicons/react** and **\@headlessui/react**.

Before diving into development, make sure the required tools are
installed on your machine. This includes **Node.js v18 or higher** and
**Docker Desktop** (for macOS/Windows) or **Docker Engine** (for Linux).
These are necessary to run the backend services and the data pipeline.

To set up the frontend locally, follow these steps:

1.  **Run** npm install to download all frontend packages.

2.  **Run** npx puppeteer browsers install chrome for export
    > functionality.

3.  **Initialize** your .env file by running cp .env.example .env to
    > bring over all the necessary environment variables. Update the AWS
    > tokens accordingly.

4.  **Start Docker Containers, open** Docker Desktop and start the
    > **mariadb** container. Then, open a terminal and run the following
    > to enter the **pipe** container: docker exec -it pipe sh.

5.  Within the docker exec command line,run python DB_Util/init_db.py to
    > initialize tables.

6.  Within the docker exec command line still, run python main.py -c
    > config.json to run the pipe to populate the table to see data on
    > the frontend (without this errors will be displayed on the
    > frontend).

## **Improvements**

There are currently two observed and suggested areas of improvements on
the dashboard:

1.  The assumption regarding all files having a ground truth file may
    > not be the case. Currently all files are assumed to have a ground
    > truth workable link but this may not always be the case.

2.  The errors on the actions/backend side are not covered as this is a
    > development/research tool. For more product and production level
    > system experience, appropriate backend (i.e. sql + server side)
    > error messages can be displayed.

# **LAS 1 Routing System Developer Guide - Backend**

## **Table of Contents**

1.  [[Project Structure and
    > Roles]{.underline}](#project-structure-and-roles-with-extension-tips)

2.  [[Overview](#overview)\
    > ]{.underline}

3.  [[System Pipeline Overview](#system-pipeline-overview)\
    > ]{.underline}

4.  [[File-by-File Deep Dive](#file-by-file-deep-dive)\
    > ]{.underline}

5.  [How METADATA_DICT
    > Works](#how-metadata_dict-works)[\
    > ]{.underline}

6.  [[Project Directory Layout](#project-directory-layout)\
    > ]{.underline}

7.  [[Quickstart for New Developers](#quickstart-for-new-developers)\
    > ]{.underline}

8.  [[How to Add a New Classifier](#how-to-add-a-new-classifier)\
    > ]{.underline}

9.  [[How to Add a New Metric](#how-to-add-a-new-metric)\
    > ]{.underline}

10. [[Common Debugging Strategies](#common-debugging-strategies)\
    > ]{.underline}

## **Project Structure and Roles (with Extension Tips)**

  ----------------------------------------------------------------------------
  **Module/File**          **Role & Extension Ideas**
  ------------------------ ---------------------------------------------------
  main.py                  Pipeline controller. Extend to support parallelism
                           or hook-based lifecycle events.

  AudioProcessor.py        Uses Wave2Vec2 to extract features. Swap out with
                           any HuggingFace audio model, or extend validation
                           rules.

  AudioClassifier.py       Applies a model (e.g., KMeans) to predict audio
                           type. Can be extended to support deep classifiers
                           or confidence thresholds.

  AudioRouter.py           Routes files based on classification. Add routing
                           fallback or support for asynchronous API calls.

  MetadataSaver.py         Writes pipeline metadata to MySQL. Add support for
                           PostgreSQL or batch-upsert strategies.

  init_db.py               Creates DB schema. Extend with indexing, views, or
                           metrics tables.

  AudioLoader.py           Handles loading from S3 or local files. Extend to
                           Google Cloud or Azure storage.

  WERCalculator.py         Computes Word Error Rate. Swap evaluate for other
                           libraries or custom metrics.

  LevenshteinDistance.py   Computes edit distance. Extend to support
                           Damerau-Levenshtein or string preprocessing.

  CosineSimilarity.py      Measures transcript similarity. Add stopword
                           filtering or alternative vectorizers.
  ----------------------------------------------------------------------------

## **Overview**

The LAS 1 Routing System is a modular, extensible pipeline for
processing and classifying audio data. The system performs the following
tasks:

1.  **Preprocesses audio** using Wave2Vec.

2.  **Classifies feature vectors** using a trained ML model.

3.  **Routes files** to subtask endpoints.

4.  **Stores metadata** in a MySQL (MariaDB) database.

This guide is designed to help new developers understand and extend the
system.

## **System Pipeline Overview**

The LAS 1 Routing System processes data in four major phases, built to
support modular development and debugging:

### **1. Audio Ingestion and Preprocessing**

-   Input can be a path to a local file or an S3 key.

-   Audio files are standardized to mono-channel, 16 kHz WAV format
    > using pydub.

-   Validation ensures the file meets minimum quality thresholds
    > (length, channel, format).

-   Valid files are then processed by HuggingFace's Wav2Vec2 model to
    > produce an embedding:

input_values = self.processor(audio, sampling_rate=16000,
return_tensors=\"pt\").input_values

feature_vector =
self.model(input_values).last_hidden_state.mean(dim=1).detach().numpy()

### **2. Classification**

-   Extracted features are passed to a trained classifier (e.g., KMeans
    > or SVM).

-   Predictions are stored with softmax confidence scores. Optional UMAP
    > transformation is available for 2D projection.

distance_from_centroids = softmax(self.model.transform(tensor),
axis=1)\[0\]

prediction = self.model.predict(tensor)\[0\]

-   \
    > Classifier data is stored in a structured dictionary for logging
    > and visualization.

### **3. Routing and Subtask Delivery**

-   Each classification is mapped to a remote STT endpoint defined in
    > subtask_models from the config.

-   The selected file is posted to that endpoint:

response = requests.post(subtask_url, files={\"file\": (filename,
BytesIO(audio_data))})

-   \
    > Transcription results are compared to the ground truth file (also
    > fetched from S3).

-   Accuracy is evaluated using WER, Levenshtein, and Cosine Similarity:

wer = WERCalculator.calculate_wer(transcribed_file, ground_truth_file)

### **4. Metadata Logging**

-   Each file's analytics are stored in a global structure called
    > METADATA_DICT:

METADATA_DICT\[file_id\] = \[processor_data, classifier_data,
router_data\]

-   \
    > This dictionary is passed to save_metadata() to write results to
    > MySQL, organized across multiple normalized tables
    > (InputProcessor, DataClassifier, DataRouter).

The LAS 1 Routing System processes data in four major phases:

### **1. Audio Ingestion and Preprocessing**

-   Audio files (local or from S3) are converted to mono WAV, 16 kHz
    > format.

-   Files undergo validation (length, sample rate, etc.).

-   Feature vectors are extracted using HuggingFace\'s Wav2Vec2.

### **2. Classification**

-   Features are passed to a pre-trained ML model (e.g., KMeans or SVM).

-   Prediction and softmax confidence scores are computed.

-   Optional 2D UMAP projections are generated for visualization.

### **3. Routing and Subtask Delivery**

-   Based on predicted class, audio is routed to a corresponding STT
    > endpoint.

-   Subtask transcription results are compared to ground truth.

-   Accuracy metrics are calculated (WER, Cosine, Levenshtein).

### **4. Metadata Logging**

-   METADATA_DICT stores per-file analytics.

-   save_metadata() records batch and per-file records in MySQL.

## **File-by-File Deep Dive**

### **main.py**

This is the orchestrator of the entire system. The most important
function is run_batch(), which drives the file-level loop.

for i, file_path in enumerate(tqdm(files, desc=\"Processing Files\",
unit=\"file\"), start=1):

tensor, audio_file, s3 = process_file(i, file_path, config)

classification = classify_file(i, tensor, model, umap_transformer)

route_data(i, file_path, audio_file, classification, subtask_models, s3)

Each file goes through process_file, classify_file, and route_data, and
has its metadata saved into METADATA_DICT.

### **AudioProcessor.py**

Responsible for input validation and feature extraction. The key method
is:

def process_audio_file(self, file_path: str) -\> np.ndarray:

temp_file_path = load_audio_local_file(file_path)

if not self.validate_input(temp_file_path):

return np.array(\[\])

feature_tensor = self.process_input(temp_file_path)

return feature_tensor

You can easily replace self.model = Wav2Vec2Model.from_pretrained(\...)
with another HuggingFace model.

### **AudioClassifier.py**

Takes the audio features and returns the predicted class. Core logic:

transformed = self.model.transform(tensor)

distance_from_centroids = softmax(transformed, axis=1)\[0\]

prediction = self.model.predict(tensor)\[0\]

You can inject any sklearn-like model and optionally apply a UMAP
projection using self.umap_transformer.transform(\...).

### **AudioRouter.py**

Routes files based on the predicted class label. Most critical
operation:

subtask_url = subtask_models\[str(prediction)\]

response = requests.post(subtask_url, files={\...})

You can extend this with retries or circuit breakers. It also
calculates accuracy via:

wer = WERCalculator.calculate_wer(transcription, ground_truth)

### **MetadataSaver.py**

Writes to MySQL using three INSERTs per file (plus for
batch/model/centroids). Example:

cursor.execute(\"\"\"

INSERT INTO InputProcessor (fileID, batchID, fileName, \...)

VALUES (%s, %s, %s, \...)

\"\"\", (\...))

To switch to PostgreSQL, update connector imports and SQL syntax.

### **init_db.py**

Initializes the database schema. The schema block is managed as one big
string:

schema_sql = f\"\"\"

CREATE DATABASE IF NOT EXISTS {database_name};

\...

\"\"\"

Modify here to add new tables or indexes.

### **AudioLoader.py**

Handles file I/O and format conversion. Example:

audio = AudioSegment.from_file(file_path)

audio =
audio.set_frame_rate(target_sample_rate).set_channels(target_channels)

Useful for loading any file type and exporting .wav consistently.

### **WERCalculator.py, LevenshteinDistance.py, CosineSimilarity.py**

Each of these defines a single function for computing an evaluation
metric from a transcript pair.

WERCalculator.wer.compute(references=\[reference\],
predictions=\[hypothesis\])

These can be expanded with new metrics like BLEU or ROUGE.

## **How METADATA_DICT Works**

The METADATA_DICT is a global dictionary declared in main.py. It holds
structured metadata for every processed file across all pipeline stages:

METADATA_DICT = {}

### **Population Process:**

Each file is assigned a unique file_id (based on its index in the input
CSV). For each file, METADATA_DICT\[file_id\] becomes a list of three
dictionaries:

1.  **AudioProcessor Output (index 0)\
    > **

    -   Contains: filename, byte_size, processing_time,
        > validation_status, feature_extraction_success, feature_shape

    -   Collected in: process_file() from
        > AudioProcessor.get_analytics_data()

2.  **Classifier Output (index 1)\
    > **

    -   Contains: prediction, class confidence scores, and optionally
        > x/y if UMAP is used

    -   Collected in: classify_file() from
        > AudioClassifier.get_classifier_data()

3.  **Router Output (index 2)\
    > **

    -   Contains: routing_time, subtask_model, delivery_time,
        > fileWordErrorRate, transcriptionFilename, ground_truth

    -   Collected in: route_data() from AudioRouter.get_router_data()

### **Example Entry:**

****METADATA_DICT\[1\] = \[

{\"filename\": \"file.wav\", \"processing_time\": 1034, \...},

{\"prediction\": 0, 0: 0.98, 1: 0.02, \"x\": 1.234, \"y\": 2.345},

{\"routing_time\": 523, \"fileWordErrorRate\": 0.12, \...}

\]

This structure is passed to save_metadata() where it is written to the
corresponding DB tables: InputProcessor, DataClassifier, and DataRouter.

## **Project Directory Layout**

Understanding the expected file structure is important to avoid
file-not-found errors and ensure proper module imports. Here\'s an
overview of how your project should be organized:

project-root/

├── main.py \# Entry point for batch processing

├── config.json \# Your configuration file

├── paths.csv \# Input CSV listing audio file paths

├── requirements.txt \# Python dependencies

├── Dockerfile \# (Optional) container setup for backend

├── model/

│ └── trained_model.joblib \# Your saved classifier model

├── DataClassifier/

│ ├── AudioClassifier.py \# Core classifier class

│ ├── DataClassifier.py \# Abstract base for classifier modules

├── DataRouter/

│ ├── AudioRouter.py \# STT routing + metrics

│ ├── DataRouter.py \# Abstract base class

├── InputProcessor/

│ ├── AudioProcessor.py \# Preprocessing pipeline

│ ├── InputProcessor.py \# Abstract base class

├── FileRetrieval/

│ └── AudioLoader.py \# S3 + local audio loading

├── DB_Util/

│ ├── init_db.py \# Creates database tables

│ └── MetadataSaver.py \# Saves pipeline results to MySQL

├── tools/

│ ├── WERCalculator.py \# Word Error Rate implementation

│ ├── LevenshteinDistance.py \# Edit distance calculator

│ ├── CosineSimilarity.py \# Similarity between transcripts

│ └── (your_metric).py \# Add custom metrics here (e.g., BLEU)

├── test/

│ └── test\_\*.py \# Pytest files for unit testing

└── Whisper/ \# Optional subtask implementation

├── app.py

└── Dockerfile

Make sure any additional models, metrics, or data routing logic you
implement align with this structure to ensure imports and integration go
smoothly.

## **Quickstart for New Developers**

If you\'re joining the LAS 1 Routing System project and want to get the
system up and running as quickly as possible, follow these steps:

### **1. Set Up Your Environment**

-   Make sure Python 3.10+ is installed.

-   Install dependencies:

pip install -r requirements.txt \# or use the full list in the guide if
no file is provided

-   \
    > Ensure you have a MySQL-compatible database ready (e.g., MariaDB
    > running via Docker).

-   Set environment variables for database connection:

export DB_HOST=localhost

export DB_USERNAME=root

export DB_PASSWORD=example

export DB_DATABASE=DataRoutingDB

### **2. Prepare Artifacts**

-   Create a model/ folder and place your .joblib classifier there.

-   Prepare input_files.csv with a column labeled Paths that points to
    > local files or S3 keys.

-   Fill out a valid config.json using the documented format.

### **3. Example config.json**

Below is a fully filled-out configuration file:

{

\"csv_path\": \"input_files.csv\",

\"model_path\": \"model/trained_model.joblib\",

\"bucket_name\": \"your-bucket-name\",

\"aws_access_key_id\": \"YOUR_AWS_KEY\",

\"aws_secret_access_key\": \"YOUR_AWS_SECRET\",

\"subtask_models\": {

\"0\": \"http://localhost:5000/api/transcribe/model0\",

\"1\": \"http://localhost:5000/api/transcribe/model1\"

}

}

-   \
    > Ensure the paths and URLs reflect your deployment setup.

-   If using local files only, you can omit bucket_name and AWS
    > credentials.

### **4. Initialize the Database**

****python init_db.py

This will create all necessary tables if they don\'t already exist.

### **5. Run the Pipeline**

****python main.py -c path/to/config.json

You should see progress output from tqdm as files are processed.

**Success Looks Like:**

-   Files are processed with no critical errors.

-   Logs show Metadata saved successfully.

-   You can connect to the database and see rows in the Batch, Model,
    > and InputProcessor tables.

If you\'re joining the LAS 1 Routing System project and want to get the
system up and running as quickly as possible, follow these steps:

### **1. Set Up Your Environment**

-   Make sure Python 3.10+ is installed.

-   Install dependencies:

pip install -r requirements.txt \# or use the full list in the guide if
no file is provided

-   \
    > Ensure you have a MySQL-compatible database ready (e.g., MariaDB
    > running via Docker).

-   Set environment variables for database connection:

export DB_HOST=localhost

export DB_USERNAME=root

export DB_PASSWORD=example

export DB_DATABASE=DataRoutingDB

### **2. Prepare Artifacts**

-   Create a model/ folder and place your .joblib classifier there.

-   Prepare input_files.csv with a column labeled Paths that points to
    > local files or S3 keys.

-   Fill out a valid config.json using the documented format.

### **3. Initialize the Database**

****python init_db.py

This will create all necessary tables if they don\'t already exist.

### **4. Run the Pipeline**

****python main.py -c path/to/config.json

You should see progress output from tqdm as files are processed.

**Success Looks Like:**

-   Files are processed with no critical errors.

-   Logs show Metadata saved successfully.

-   You can connect to the database and see rows in the Batch, Model,
    > and InputProcessor tables.

## **How to Add a New Classifier**

To add a new classification model to the LAS 1 system, follow these
steps:

### **1. Train Your Model**

Use any scikit-learn compatible model. For example:

from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3)

kmeans.fit(training_features)

### **2. Save the Model**

****import joblib

joblib.dump(kmeans, \"model/trained_model.joblib\")

### **3. Update Your Config**

In your config.json:

{

\"model_path\": \"model/trained_model.joblib\",

\...

}

### **4. (Optional) Add New Routing Rules**

If your new model includes different classification outputs, update the
subtask_models map:

{

\"0\": \"http://localhost:5000/api/transcribe/model0\",

\"1\": \"http://localhost:5000/api/transcribe/model1\",

\"2\": \"http://localhost:5000/api/transcribe/model2\"

}

You can now re-run the system with the new classifier.

## **How to Add a New Metric**

To add a new transcript accuracy metric, such as BLEU, follow these
steps:

### **1. Create a New Metric Module**

-   Add a new Python file to the tools/ directory. For example:
    > BLEUCalculator.py

from nltk.translate.bleu_score import sentence_bleu

class BLEUCalculator:

\@staticmethod

def calculate_bleu(hypothesis_file, reference_file):

with open(hypothesis_file, \'r\') as h, open(reference_file, \'r\') as
r:

hypothesis = h.read().strip().split()

reference = \[r.read().strip().split()\]

return sentence_bleu(reference, hypothesis)

### **2. Register the Metric in AudioRouter**

Inside AudioRouter.py, after existing metrics like WER or Levenshtein,
add:

from tools.BLEUCalculator import BLEUCalculator

\...

bleu = BLEUCalculator.calculate_bleu(transcribed_path,
ground_truth_path)

self.router_data\[\"fileBLEU\"\] = bleu

### **3. Update the Database**

You must extend the schema to store this new metric:

#### **Modify init_db.py**

Find the CREATE TABLE DataRouter section and add a new column:

fileBLEU DOUBLE,

Then re-run init_db.py (dropping and recreating the DB) or manually
alter the table:

ALTER TABLE DataRouter ADD COLUMN fileBLEU DOUBLE;

#### **Update MetadataSaver.py**

Locate the INSERT INTO DataRouter statement and add the new field:

value\[DATA_ROUTER_INDEX\].get(\"fileBLEU\", 0)

Include it in the value tuple and insert SQL string.

Once this is in place, your new BLEU metric will be calculated, tracked
in router_data, and stored in the database alongside other evaluation
metrics.

## **Common Debugging Strategies**

-   **Audio not processed:** Ensure the audio is mono WAV, 16 kHz, and
    > at least 1 second long.

-   **Empty feature tensor:** Check if the input passed validation and
    > if Wave2Vec2Processor is loading correctly.

-   **Model not found:** Confirm that model_path in the config is
    > accurate and that the .joblib model implements .transform() and
    > .predict().

-   **UMAP errors:** If no UMAP transformer is supplied, ensure model
    > has cluster_centers\_ or skip projection.

-   **MySQL errors:** Confirm .env values are loaded and that the Docker
    > container is running and exposing port 3306.

-   **S3 download issues:** Ensure AWS credentials and bucket/key values
    > in the config are valid. Add logging at the download_file_from_s3
    > call.

-   **Metadata not written:** Ensure METADATA_DICT was populated (check
    > logs). Trace each entry through main.py.
