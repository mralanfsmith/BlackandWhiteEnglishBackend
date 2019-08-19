DROP DATABASE IF EXISTS wom;
CREATE DATABASE wom OWNER wom;

\c wom;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sentences (
    sentenceid serial PRIMARY KEY,
    language VARCHAR (40),
    sentence TEXT,
    audio TEXT
);

CREATE TABLE links (
	linkid serial PRIMARY KEY,
    sentence_one INT,
    sentence_two INT
);
