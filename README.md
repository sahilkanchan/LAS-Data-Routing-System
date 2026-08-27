# LAS Data Router

## Overview

LAS Data Router is a research prototype built for NC State's **Laboratory for Analytical Sciences (LAS)** to test a hypothesis: *would a family of specialized, accent-tuned speech-to-text (STT) models outperform a single general-purpose model like Whisper V3?*

Instead of sending every audio file to one general STT model, this system:
1. Extracts feature vectors from incoming audio using **Wav2Vec 2.0**
2. Clusters those features with a trained **KMeans** model to classify the audio's characteristics (e.g. accent/dialect)
3. Routes the file to the specialized **Whisper-based transcription model** best suited to that cluster
4. Stores the transcription plus metadata (routing time, classification label, word error rate, similarity scores) for analysis
5. Surfaces all of that in a **web dashboard** for researchers to compare specialized-model performance against the general-model baseline

Researchers use it by uploading audio files to an S3 bucket, listing their paths in a CSV file, running the pipeline (`main.py`) against that CSV, and then reviewing results — transcriptions, WER, latency, routing decisions — on the dashboard.

It was built as a senior design project (NC State, Team 20, Spring 2025) in partnership with LAS, a research organization that partners with government, academic, and industry groups on data analysis for the intelligence community. Learn more at [ncsu-las.org](https://ncsu-las.org/).

The system is split into three main parts:

- **`pipe/`** — Python backend pipeline that processes a batch of audio files: downloads them from S3, extracts features and classifies them (Wav2Vec 2.0 + KMeans), routes them to the matching specialized Whisper model for transcription, and saves metadata + transcription to the database.
- **`dashboard/`** — Next.js + TypeScript web dashboard for reviewing batch results: transcriptions, classification confidence, word error rate, transcription time, routing breakdowns (Sankey diagrams), and PDF report export.
- **Supporting services** — MariaDB for storage and a standalone Whisper transcription microservice, orchestrated with Docker Compose (Redis is also available for caching/queueing).

## Architecture

```
┌──────────────────┐     ┌────────────────────────┐     ┌──────────────────┐
│  InputProcessor   │ --> │  DataClassifier         │ --> │  DataRouter      │
│  (load audio from │     │  (Wav2Vec 2.0 features  │     │  (route to the   │
│   S3 via CSV list) │     │   -> KMeans clustering) │     │   matching       │
└──────────────────┘     └────────────────────────┘     │   subtask model) │
                                                          └──────────────────┘
                                                                    │
                                                                    v
                                                        ┌────────────────────┐
                                                        │  Specialized        │
                                                        │  Whisper model      │
                                                        │  (per accent/       │
                                                        │   dialect cluster)  │
                                                        └────────────────────┘
                                                                    │
                                                                    v
┌──────────────────┐     ┌────────────────────┐
│    DB_Util        │ --> │   MariaDB           │ <--- viewed by dashboard
│ (save transcript + │     │  (transcriptions,   │      (WER, latency,
│  metadata)         │     │   metadata, WER)    │       routing breakdown)
└──────────────────┘     └────────────────────┘
```

## Tech Stack

**Backend (`pipe/`)**
- Python, with `transformers`, `torch`, `librosa`, `pydub` for audio ML/processing
- `umap-learn` for dimensionality reduction
- `boto3` for S3 access
- `mysql-connector-python` for database access

**Dashboard (`dashboard/`)**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- `recharts` / `@visx` + `d3-sankey` for data visualization
- AWS S3 SDK, MySQL2, Redis clients

**Infrastructure**
- MariaDB (storage)
- Redis (caching/queueing)
- Whisper (speech-to-text microservice)
- Docker Compose (orchestration)

## Project Structure

```
.
├── dashboard/          # Next.js web dashboard
├── pipe/               # Python audio processing pipeline
│   ├── InputProcessor/     # Loads and prepares audio
│   ├── DataClassifier/     # Classifies audio into categories
│   ├── DataRouter/         # Routes classified audio to subtask models
│   ├── DB_Util/            # Database read/write helpers
│   ├── FileRetrieval/      # S3 download logic
│   ├── Whisper/            # Transcription microservice
│   └── main.py             # Pipeline entrypoint (CLI)
├── docker-compose.yml   # Orchestrates dashboard, backend, db, whisper, redis
├── init.sql             # Initial database schema
└── .env.example         # Template for required environment variables
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.9+ (if running the pipeline outside Docker)
- Node.js 18+ (if running the dashboard outside Docker)

### 1. Configure environment variables

Copy the example env files and fill in real values:

```bash
cp .env.example .env
cp dashboard/.env.example dashboard/.env
cp pipe/config.json.example pipe/config.json
```

You'll need:
- AWS credentials + an S3 bucket (for audio storage/retrieval)
- Database credentials (used to configure the MariaDB container)
- Whisper API endpoint config (if not running the bundled Whisper service)

### 2. Start services with Docker Compose

The compose file uses **profiles** so you can start only what you need:

```bash
# Start everything (frontend + backend + db + whisper + redis)
docker compose --profile frontend --profile backend --profile whisper --profile redis up

# Just the dashboard + database
docker compose --profile frontend up

# Just the backend pipeline + database
docker compose --profile backend up
```

The dashboard will be available at `http://localhost:<DASH_PORT>` (default 3000).

### 3. Run a batch through the pipeline

The pipeline processes audio in **batches**, defined by a CSV file:

1. Upload your `.mp3`/`.wav` files to the configured S3 bucket.
2. Create a CSV listing the file paths for that batch, and save it locally.
3. Set that CSV's path as `csv_path` in `pipe/config.json`.
4. Run the pipeline:

```bash
cd pipe
python main.py --config config.json
```

5. Open the dashboard to view transcriptions, classification/routing results, and word error rate for the batch.

## Development

**Dashboard**
```bash
cd dashboard
npm install
npm run dev
```

**Pipeline**
```bash
cd pipe
pip install -r requirements.txt
python main.py --config config.json
```

## Documentation

More detail is available in the accompanying project documents (not included in this repo by default):
- **Project Report** — full problem background, requirements, design rationale, and testing
- **Developer's Guide** — codebase walkthrough for contributors
- **Deployment Guide** — environment setup and deployment steps
- **User Manual** — how to run a batch and read dashboard results

## Team

Built by **Team 20** — Connor Robinson, Hunt Tynch, Noah Clouser, Sahil Kanchan, and Maxim Shelepov — as part of NC State's Senior Design program, Spring 2025, sponsored by the **Laboratory for Analytical Sciences (LAS)**.
