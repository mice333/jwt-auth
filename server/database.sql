CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_activated BOOLEAN DEFAULT FALSE,
    activation_link VARCHAR(255)
);

CREATE TABLE tokens(
    id SERIAL PRIMARY KEY,
    user INTEGER,
    refreshToken VARCHAR(255),
    FOREIGN KEY (user) REFERENCES users(id)
);
