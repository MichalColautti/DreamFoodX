CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  author VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rating FLOAT DEFAULT 0,
  image VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  UNIQUE(user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  UNIQUE(user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE IF NOT EXISTS steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  step_order INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  temperature INT DEFAULT NULL,      
  blade_speed INT DEFAULT NULL,       
  duration INT DEFAULT NULL,          
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS step_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  step_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) DEFAULT NULL,
  unit VARCHAR(20) DEFAULT NULL,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS catalog_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES ingredient_categories(id) ON DELETE CASCADE
);

INSERT INTO ingredient_categories (name) VALUES
('Warzywa'),
('Owoce'),
('Nabial'),
('Mieso'),
('Przyprawy');

INSERT INTO catalog_ingredients (category_id, name) VALUES
(1, 'Marchew'),
(1, 'Pomidory'),
(1, 'Cebula'),
(1, 'Papryka'),
(2, 'Jablko'),
(2, 'Banan'),
(2, 'Truskawki'),
(3, 'Ser zolty'),
(3, 'Maslo'),
(3, 'Jogurt naturalny'),
(4, 'Kurczak'),
(4, 'Wolowina'),
(4, 'Wieprzowina'),
(5, 'Sol'),
(5, 'Pieprz'),
(5, 'Papryka slodka'),
(5, 'Czosnek w proszku');