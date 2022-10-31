CREATE DATABASE myBookshop;
USE myBookshop;
CREATE TABLE books (id INT AUTO_INCREMENT,name VARCHAR(50),price DECIMAL(5, 2) unsigned,PRIMARY KEY(id));
INSERT INTO books (name, price)VALUES('database book', 40.25),('Node.js book', 25.00), ('Express book', 31.99) ;
CREATE USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password123';
GRANT ALL PRIVILEGES ON myBookshop.* TO 'root'@'localhost';