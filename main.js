const mysql = require('mysql2');
require('dotenv').config();

const inquirer = require('inquirer');
const cTable = require('console.table');

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
db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}; USE ${process.env.DB_NAME};`, 
        (err, results) => {
            if (err) {
                console.error(err);
                return;
            }
            // DB connection and query must finish before inquirer can start running.
            // To accomplish this, I put the inquirer code into a chain of discrete functions
            // and made sure that chain can only begin after DB creation and query.
            // This callback function only executes after those are done, so it's the best place to begin the chain.
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
                message: "Enter the name of your new deparment:",
                name: "newDeptName",
                when: (answers) => answers.mainMenuSelection === "Add a department"
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
        err
        ? console.error(err)
        : console.log(results);
        inquirer
            .prompt([
                {
                    type: "list",
                    message: "What would you like to do?",
                    choices: ["Create a new department", "Update an existing department"]
                }
            ])
    })
}

function viewAllRoles() {

}

function viewAllEmployees() {

}

function createDepartment() {

}

function createRole() {

}

function addEmployee() {

}

function updateEmployeeRole() {

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