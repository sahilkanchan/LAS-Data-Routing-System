CREATE DATABASE IF NOT EXISTS DataRoutingDB;

USE DataRoutingDB;

CREATE TABLE IF NOT EXISTS Batch (
    batchID INT AUTO_INCREMENT PRIMARY KEY,
    numFiles INT NOT NULL
);

CREATE TABLE IF NOT EXISTS InputProcessor (
    fileID INT,
    batchID INT,
    fileName VARCHAR(255) NOT NULL,
    bytes INT NOT NULL,
    processingTime TIME NOT NULL,
    isValid TINYINT NOT NULL,
    shape VARCHAR(16) NOT NULL,
    PRIMARY KEY (fileID, batchID), -- Composite primary key
    FOREIGN KEY (batchID) REFERENCES Batch(batchID) -- Foreign key constraint
);

CREATE TABLE IF NOT EXISTS DataClassifier (
    fileID INT,
    batchID INT,
    classificationTime TIME NOT NULL,
    PRIMARY KEY (fileID, batchID), -- Composite primary key
    FOREIGN KEY (batchID) REFERENCES Batch(batchID) -- Foreign key constraint
);

CREATE TABLE IF NOT EXISTS Scores (
    fileID INT,
    batchID INT,
    classifier VARCHAR(255) NOT NULL,
    score DOUBLE NOT NULL,
    PRIMARY KEY (fileID, batchID), -- Composite primary key
    FOREIGN KEY (batchID) REFERENCES Batch(batchID) -- Foreign key constraint
);

CREATE TABLE IF NOT EXISTS DataRouter (
    fileID INT,
    batchID INT,
    routingTime TIME NOT NULL,
    subtaskModel VARCHAR(255) NOT NULL,
    PRIMARY KEY (fileID, batchID), -- Composite primary key
    FOREIGN KEY (batchID) REFERENCES Batch(batchID) -- Foreign key constraint
);

CREATE TABLE IF NOT EXISTS DataDelivery (
    fileID INT,
    batchID INT,
    deliveryTime TIME NOT NULL,
    PRIMARY KEY (fileID, batchID), -- Composite primary key
    FOREIGN KEY (batchID) REFERENCES Batch(batchID) -- Foreign key constraint
);