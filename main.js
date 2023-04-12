const mysql = require('mysql2');
require('dotenv').config();

const inquirer = require('inquirer');
const cTable = require('console.table');

const initDB = require('./initDB');

// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    },
    (err) => {
        if (err) throw err;
        //console.log(`Connected to ${process.env.DB_NAME} database.`);
    }
);

// create and use database
db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};
          USE ${process.env.DB_NAME};`, 
        (err, results) => {
            if (err) {
                console.error(err);
                return;
            }
            // DB connection and query must finish before inquirer can start running.
            // To accomplish this, I put the inquirer code into a chain of discrete functions
            // and made sure that chain can only begin after DB creation and query.
            // This callback function only executes after those are done, so it's the best place to begin the chain.
            initDB(db); // Initialize database with the three base tables: Departments, Roles, and Employees
            printTitleScreen(); // this is a separate function just to avoid some clutter
            mainMenu(); // begin the inquirer chain
        });

function mainMenu() {
    
    console.log("\n\n-=<(  MAIN MENU  )>=-\n")

    inquirer
        .prompt([
            {
                type: "list",
                message: "What would you like to do?",
                choices: ["View all departments", "View all roles", "View all employees", "Add a department", "Add a role", "Add an employee", "Update an employee role", "Exit"],
                name: "mainMenuSelection"
            },
            {
                type: "input",
                message: "Enter the name of your new role:",
                name: "newRoleName",
                when: (answers) => answers.mainMenuSelection === "Add a role"
            },
            {
                type: "input",
                message: "Employee Name:",
                name: "newEmployeeName",
                when: (answers) => answers.mainMenuSelection === "Add an employee"
            }
        ])
        .then((answers) => {
            switch (answers.mainMenuSelection) {
                case "View all departments":
                    viewAllDepartments();
                    break;

                case "View all roles":
                    viewAllRoles();
                    break;

                case "View all employees":
                    viewAllEmployees();
                    break;

                case "Add a department":
                    createDepartment(answers.newDeptName);
                    break;

                case "Add a role":
                    createRole(answers.newRoleName, answers.newRoleSalary);
                    break;

                case "Add an employee":
                    addEmployee();
                    break;

                case "Update an employee role":
                    updateEmployeeRole();
                    break;

                default:
                    console.log("Invalid value detected. Returning to main menu.");
                    mainMenu();
                    break;
            }

            // Process user's input here
            if (answers.mainMenuSelection === "Add a department") {
                // Add a department to the database
            } else if (answers.mainMenuSelection === "Add a role") {
                // Add a role to the database
            } else if (answers.mainMenuSelection === "Add an employee") {
                // Add an employee to the database
            } else if (answers.mainMenuSelection === "Update an employee role") {
                // Update an employee's role in the database
            } else if (answers.mainMenuSelection === "Exit") {
                console.log("Goodbye.")
                db.end();
            } else {
                // View all departments, roles, or employees
            }
        })
        .catch((error) => {
            console.error(error);
        });
};


function viewAllDepartments() {
    db.query('SHOW TABLES;', (err, results) => {
        if (err) {
            return console.error(err);
        }
        if (results.length === 0) {
            // If we're here that means there are no departments in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no departments in the database to view.\nPlease select option \"Add a department\" from the main menu.");
            mainMenu();
        } else {
            
        }
    });
}

function viewAllRoles() {

}

function viewAllEmployees() {

}

function createDepartment() {
    inquirer
        .prompt([
            {
                type: "input",
                message: "New department name:",
                name: "newDeptName"
            }
        ])
        .then(answers => {
            db.query(`CREATE TABLE ${answers.newDeptName} (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(30) NOT NULL,
                PRIMARY KEY (id),
                UNIQUE (id, name)
            );`, (err) => err ? console.error(err) : console.log(`${answers.newDeptName} added to database.`));
        }) // do I need that UNIQUE constraint?
        .catch(err => {
            if (err) console.error(err);
        })
}

function createRole() {
    inquirer
        .prompt([
            {
                type: "input",
                message: "New role name:",
                name: "newRoleTitle"
            }
        ])
        .then(answers => {
            db.query(`INSERT INTO roles
                      VALUES ();`, (err) => err ? console.error(err) : console.log(`${answers.newDeptName} added to database.`));
        }) // do I need that UNIQUE constraint?
        .catch(err => {
            if (err) console.error(err);
        })
}

function addEmployee() {

}

function updateEmployeeRole() {

}

/**
 * Capitalizes the first letter of every word in a string, using default space character as delimiter.
 * Useful for styling lowercase table names when displaying them to the user.
 * @param {string} str The string to convert to title case.
 * @returns {string} A new title-cased string.
 */
function toTitleCase(str) {
    return str.split(" ").map(word => word.substring(0,1).toUpperCase() + word.substring(1)).join(" ");
}


function printTitleScreen() {
    console.log(" _______________________________________");
    console.log("|\\______________________________________\\");
    console.log("||                                       |");
    console.log("||    E M P L O Y E E    T R A C K E R   |");
    console.log("\\|_______________________________________|\n");
    console.log("Welcome to Sumtwelve's Employee Tracker!");
    console.log("An easy-to-use CMS right in your favorite command line.")
}