from mysql.connector import connection
import os

database_name = os.getenv("DB_DATABASE")
if database_name is None:
    database_name = "DataRoutingDB"

config = {
    # This is should be the Database Serivce Name
    "host": os.getenv("DB_HOST"),
    # User specific for this Database
    "user": os.getenv("DB_USERNAME"),
    "password": os.getenv("DB_PASSWORD"),
    # The database in question
    "database": database_name,
    # Port number for the database container (NOT LOCAL)
    "port": 3306
}

conn = connection.MySQLConnection(**config)
cursor = conn.cursor()

# Drop the database if it exists

cursor.execute(f"DROP DATABASE IF EXISTS {database_name};")
conn.commit()

schema_sql = f"""
CREATE DATABASE IF NOT EXISTS {database_name};
USE {database_name};

-- Batch table (each batch will have one unique model)
CREATE TABLE IF NOT EXISTS Batch (
    batchID INT AUTO_INCREMENT PRIMARY KEY,
    numFiles INT NOT NULL,
    benchmark TINYINT NOT NULL DEFAULT 0,
    batchWordErrorRate DOUBLE DEFAULT 0,
    totalTime BIGINT DEFAULT 0,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model table now holds a unique batchID to enforce a one-to-one relationship with Batch
CREATE TABLE IF NOT EXISTS Model (
    modelID INT AUTO_INCREMENT PRIMARY KEY,
    batchID INT NOT NULL UNIQUE,
    modelName VARCHAR(255) NOT NULL,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    FOREIGN KEY (batchID) REFERENCES Batch(batchID)
);

-- Centroids table holds many centroids for each model
CREATE TABLE IF NOT EXISTS Centroids (
    centroidID INT AUTO_INCREMENT PRIMARY KEY,
    modelID INT NOT NULL,
    centroid INT NOT NULL,
    graph_x DOUBLE NOT NULL,
    graph_y DOUBLE NOT NULL,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    FOREIGN KEY (modelID) REFERENCES Model(modelID)
);

CREATE TABLE IF NOT EXISTS InputProcessor (
    fileID INT,
    batchID INT,
    fileName VARCHAR(255) NOT NULL,
    bytes INT NOT NULL,
    processingTime BIGINT NOT NULL,
    isValid TINYINT NOT NULL,
    shape VARCHAR(16) NOT NULL,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    PRIMARY KEY (fileID, batchID),
    FOREIGN KEY (batchID) REFERENCES Batch(batchID)
);

CREATE TABLE IF NOT EXISTS DataClassifier (
    fileID INT,
    batchID INT,
    prediction INT NOT NULL,
    classificationTime BIGINT NOT NULL,
    graph_x DOUBLE,
    graph_y DOUBLE,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    PRIMARY KEY (fileID, batchID),
    FOREIGN KEY (batchID) REFERENCES Batch(batchID)
);

CREATE TABLE IF NOT EXISTS DataRouter (
    fileID INT,
    batchID INT,
    routingTime BIGINT NOT NULL,
    subtaskModel VARCHAR(255) NOT NULL,
    deliveryTime BIGINT NOT NULL,
    fileWordErrorRate DOUBLE NOT NULL,
    transcriptionFilename VARCHAR(255) NOT NULL,
    groundTruthFilename VARCHAR(255) NOT NULL,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    PRIMARY KEY (fileID, batchID),
    FOREIGN KEY (batchID) REFERENCES Batch(batchID)
);
"""

for stmt in schema_sql.split(";"):
    if stmt.strip():
        cursor.execute(stmt)

conn.commit()
cursor.close()
conn.close()

print("Database initialized successfully!")
