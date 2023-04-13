require('dotenv').config();

/**
 * Database initialization function to create three tables for employee_db:
 * Departments, Roles, and Employees. Note: Tables only created if they don't already exist.
 * @param {mysql.Connection} db Represents the connection to the database. Its '.query()' method will be called to run SQL commands.
 */
function initDB(db) {
    db.query(`USE ${process.env.DB_NAME};
    
    CREATE TABLE IF NOT EXISTS departments (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        UNIQUE (name)
    );
    
    CREATE TABLE IF NOT EXISTS roles (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(30) NOT NULL,
        salary DECIMAL NOT NULL,
        department_id INT NOT NULL,
        FOREIGN KEY (department_id)
            REFERENCES departments(id)
            ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS employees (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(30) NOT NULL,
        last_name VARCHAR(30) NOT NULL,
        is_manager BOOLEAN,
        role_id INT NOT NULL,
        manager_id INT,
        FOREIGN KEY (role_id)
            REFERENCES roles(id)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
        FOREIGN KEY (manager_id)
            REFERENCES employees(id)
            ON UPDATE CASCADE
            ON DELETE CASCADE
    );`, (error) => {if (error) console.error(error)})
}

module.exports = initDB;