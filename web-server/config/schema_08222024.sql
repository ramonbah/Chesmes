CREATE TABLE User (
    user_id CHAR(36) PRIMARY KEY,  -- UUID stored as a 36-character string
    display_name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255)
);

CREATE TABLE Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(255) NOT NULL,
    creator_id CHAR(36) NOT NULL,
    password VARCHAR(255),
    image_url VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES User(user_id),
    FOREIGN KEY (updated_by) REFERENCES User(user_id)
);

CREATE TABLE RoomUser (
    room_user_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id CHAR(36) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES Room(room_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Message (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    room_user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    reply_to_id INT,
    FOREIGN KEY (room_user_id) REFERENCES RoomUser(room_user_id),
    FOREIGN KEY (reply_to_id) REFERENCES Message(message_id)
);
