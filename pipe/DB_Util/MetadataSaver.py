import os
import uuid
import mysql.connector as connector
import logging  # Use logging for error, info, and warning messages

# Constants for indexing metadata for each component in the pipeline.
INPUT_PROCESSOR_INDEX = 0
DATA_CLASSIFIER_INDEX = 1
DATA_ROUTER_INDEX = 2

def save_metadata(metadata_dict, total_time, model_name, umap_coords):
    """
    Saves the metadata from the pipeline to the DataRoutingDB.
    
    The function performs the following steps:
      1. Establishes a connection to the MySQL database.
      2. Inserts a new Batch record and retrieves its auto-generated ID.
      3. Inserts a Model record associated with the Batch.
      4. Inserts associated centroid data into the Centroids table (if umap_coords is provided).
      5. Iterates over each file's metadata (stored in metadata_dict) and:
         - Inserts a record into the InputProcessor table.
         - Inserts a record into the DataClassifier table.
         - Inserts a record into the DataRouter table, including ground truth metadata.
      6. Commits all changes and closes the connection.
    
    Parameters:
      metadata_dict (dict): The metadata for each processed file.
      total_time (int): Total processing time in milliseconds.
      model_name (str): Name or file path of the model used.
      umap_coords (np.array): A NumPy array of 2D centroid coordinates (or None if not available).
    """
    conn = None
    cursor = None

    # Establish the database connection.
    try:
        config = {
            # This is should be the Database Serivce Name
            "host": os.getenv("DB_HOST"),
            "user": os.getenv("DB_USERNAME"),
            "password": os.getenv("DB_PASSWORD"),
            # Port number for the database container (NOT LOCAL)
            "port": 3306,
            # The database in question
            "database": os.getenv("DB_DATABASE")
        }
        conn = connector.MySQLConnection(**config)
        cursor = conn.cursor()
        logging.info("Database connection established successfully.")
    except connector.Error as err:
        logging.error("Database error on connection: %s", err)
        return  # Exit if the connection fails.
    except Exception as e:
        logging.error("Error saving metadata on connection: %s", e)
        return

    # Insert a new Batch record and retrieve its auto-generated ID.
    try:
        cursor.execute(
            """
            INSERT INTO Batch (numFiles, totalTime, uuid)
            VALUES (%s, %s, %s)
            """,
            (len(metadata_dict), total_time, str(uuid.uuid4()))
        )
        conn.commit()  # Commit the transaction for Batch insertion.
        cursor.execute("SELECT LAST_INSERT_ID();")
        batchID = cursor.fetchone()[0]
        logging.info("New Batch ID: %s", batchID)
    except Exception as e:
        logging.error("Error saving metadata on Batch: %s", e)
        if conn:
            conn.rollback()
        return

    # Insert a Model record associated with the Batch.
    try:
        cursor.execute(
            """
            INSERT INTO Model (batchID, modelName, uuid)
            VALUES (%s, %s, %s)
            """,
            (batchID, model_name, str(uuid.uuid4()))
        )
        conn.commit()  # Commit the transaction for Model insertion.
        cursor.execute("SELECT LAST_INSERT_ID();")
        modelID = cursor.fetchone()[0]
        logging.info("New Model ID: %s", modelID)
    except Exception as e:
        logging.error("Error saving metadata on Model: %s", e)
        if conn:
            conn.rollback()
        return

    # Insert centroids into the Centroids table (if umap_coords is available).
    try:
        if umap_coords is not None:
            for idx, point in enumerate(umap_coords):
                # Convert the NumPy array point to a list for explicit access.
                point = list(point)
                cursor.execute(
                    """
                    INSERT INTO Centroids (modelID, centroid, graph_x, graph_y, uuid)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (modelID, idx, float(point[0]), float(point[1]), str(uuid.uuid4()))
                )
            conn.commit()  # Commit the centroids insertion.
            logging.info("Inserted %s centroids for Model ID: %s", len(umap_coords), modelID)
    except Exception as e:
        logging.error("Error saving metadata on Centroids: %s", e)
        if conn:
            conn.rollback()

    # Insert metadata for each file into the InputProcessor, DataClassifier, and DataRouter tables.
    try:
        for key, value in metadata_dict.items():
            # Insert record into the InputProcessor table.
            try:
                cursor.execute(
                    """
                    INSERT INTO InputProcessor (fileID, batchID, fileName, bytes, processingTime, isValid, shape, uuid)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        key,  # fileID: the key for this file in the metadata dict.
                        batchID,
                        value[INPUT_PROCESSOR_INDEX].get("filename", "unknown"),
                        value[INPUT_PROCESSOR_INDEX].get("byte_size", 0),
                        value[INPUT_PROCESSOR_INDEX].get("processing_time", 0),
                        int(value[INPUT_PROCESSOR_INDEX].get("feature_extraction_success", 0)),
                        str(value[INPUT_PROCESSOR_INDEX].get("feature_shape", "unknown")),
                        str(uuid.uuid4())
                    )
                )
            except Exception as e:
                logging.error("Error saving metadata on InputProcessor file %s: %s", key, e)

            # Insert record into the DataClassifier table.
            try:
                cursor.execute(
                    """
                    INSERT INTO DataClassifier (fileID, batchID, prediction, classificationTime, graph_x, graph_y, uuid)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        key,  # fileID for this file.
                        batchID,
                        int(value[DATA_CLASSIFIER_INDEX].get("prediction", 0)),
                        value[DATA_CLASSIFIER_INDEX].get("processing_time", 0),
                        float(value[DATA_CLASSIFIER_INDEX].get("x", 0)),
                        float(value[DATA_CLASSIFIER_INDEX].get("y", 0)),
                        str(uuid.uuid4())
                    )
                )
            except Exception as e:
                logging.error("Error saving metadata on DataClassifier file %s: %s", key, e)

            # Insert record into the DataRouter table with additional ground truth metadata.
            try:
                cursor.execute(
                    """
                    INSERT INTO DataRouter (fileID, batchID, routingTime, subtaskModel, deliveryTime, fileWordErrorRate, transcriptionFilename, groundTruthFilename, uuid)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        key,  # fileID for this file.
                        batchID,
                        value[DATA_ROUTER_INDEX].get("processing_time", 0),
                        str(value[DATA_ROUTER_INDEX].get("subtask_model", 0)),
                        value[DATA_ROUTER_INDEX].get("delivery_time", 0),
                        float(value[DATA_ROUTER_INDEX].get("fileWordErrorRate", 0)),
                        str(value[DATA_ROUTER_INDEX].get("transcriptionFilename", 0)),
                        str(value[DATA_ROUTER_INDEX].get("ground_truth", "unknown")),
                        str(uuid.uuid4())
                    )
                )
            except Exception as e:
                logging.error("Error saving metadata on DataRouter file %s: %s", key, e)

        # Commit all changes made during the per-file metadata insertion.
        conn.commit()
        logging.info("Metadata successfully saved to the database.")
    except connector.Error as err:
        logging.error("Database error during metadata save: %s", err)
        if conn:
            conn.rollback()
    except Exception as e:
        logging.error("Error saving metadata: %s", e)
        if conn:
            conn.rollback()
    finally:
        # Ensure resources are closed properly.
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
