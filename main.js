const mysql = require('mysql2');
require('dotenv').config();

const inquirer = require('inquirer');
const cTable = require('console.table');

// Importing a function I wrote to create the database if it doesn't exist yet.
// Putting it in a separate function helps reduce clutter
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
        (err) => {
            if (err) {
                console.error(err)
                console.log("\nERROR: Failed to initialize database. Exiting program.");
                return db.end();
            }
            // DB connection and query must finish before inquirer can start running.
            // To accomplish this, I put the inquirer code into a chain of discrete functions
            // and made sure that chain can only begin after DB creation and query.
            // This callback function only executes after those are done, so it's the best place to begin the chain.
            initDB(db); // Initialize database with the three base tables: Departments, Roles, and Employees
            printTitleScreen(); // this is in a separate function just to avoid some clutter
            mainMenu(); // begin the inquirer chain
        });

function mainMenu() {
    
    console.log("\n-=<(  MAIN MENU  )>=-\n");

    inquirer
        .prompt([
            {
                type: "list",
                message: "What would you like to do?",
                // TODO: If you're gonna add more options, you'll need to reorganize it into something like this:
                //"Which would you like to manage?" [Departments, Roles, Employees] *selects Departments* "Options for departments:" [View all, Edit one, Create one] , etc.
                choices: ["View all departments", "View all roles", "View all employees", "Add a department", "Add a role", "Add an employee", "Edit an employee role", "Exit"],
                name: "mainMenuSelection"
            }
        ])
        .then((answers) => {
            switch (answers.mainMenuSelection) {
                case "View all departments":
                    return viewAllDepartments();

                case "View all roles":
                    return viewAllRoles();

                case "View all employees":
                    return viewAllEmployees();

                case "Add a department":
                    return createDepartment();

                case "Add a role":
                    return createRole();

                case "Add an employee":
                    return createEmployee();

                case "Edit an employee role":
                    return editEmployeeRole();

                case "Exit":
                    console.log("Goodbye!");
                    return db.end();

                default:
                    console.log("Invalid selection.");
                    return mainMenu();
            }
        })
        .catch((err) => {
            console.error(err);
            console.log("\nInquirer error detected. Returning to main menu...\n");
            return mainMenu();
        });
};


function viewAllDepartments() {
    db.query('SELECT id AS ID, name AS Name FROM departments;', (err, results) => {
        if (err) {
            console.error(err);
            console.log("\nQuery failed. Returning to main menu...\n");
        } else if (results.length === 0) {
            // If we're here that means there are no departments in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no departments in the database to view.\nPlease select \"Add a department\" from the main menu.");
        } else {
            console.log(); // just an empty line for spacing
            console.table(results);
        }

        return mainMenu();
    });
}

function viewAllRoles() {
    // SQL command to display the role name and salary next to the name of its department
    db.query(`SELECT r.title AS Role, r.salary AS Salary, d.name AS Department
              FROM roles as r
              JOIN departments as d
              ON r.department_id = d.id; `, (err, results) => {
        if (err) {
            console.error(err);
            console.log("\nQuery failed. Database unaffected. Returning to main menu...\n");
        } else if (results.length === 0) {
            // If we're here that means there are no roles in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no roles in the database to view.\nPlease select \"Add a role\" from the main menu.");
        } else {
            console.log(); // just an empty line for spacing
            console.table(results);
        }

        return mainMenu();
    });
}


function viewAllEmployees() {
    // SQL command to display the employee's role, manager status, and manager's ID next to their ID and name
    db.query(`SELECT 
                 e.id as ID,
                 e.First_Name,
                 e.Last_Name,
                 r.title AS Role,
                 r.salary AS Salary,
                 IF(e.manager_id, manager_id, '-') Manager_ID,
                 IF(e.is_manager, 'MGR', '-') Is_Manager
              FROM employees as e
              JOIN roles as r
              ON e.role_id = r.id;`, (err, results) => {
        if (err) {
            console.error(err);
            console.log("\nQuery failed. Returning to main menu...\n");
        } else if (results.length === 0) {
            // If we're here that means there are no employees in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no employees in the database to view.\nPlease select \"Add an employee\" from the main menu.");
        } else {
            console.log(); // just an empty line for spacing
            console.table(results);
        }

        return mainMenu();
    });
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
            if (answers.newDeptName === "") {
                console.log("Cannot accept empty field. Please try again.");
                return createDepartment();
            }
            answers.newDeptName = toTitleCase(answers.newDeptName);
            db.query(`INSERT INTO departments
                      VALUES (NULL, "${answers.newDeptName}");`,
                (err) => {
                    if (err) {
                        // Duplicate entry detected, prompt user to try again
                        if (err.code === 'ER_DUP_ENTRY') {
                            console.log(`A department with the name ${answers.newDeptName} already exists.`);
                            return createDepartment();
                        } else {
                            console.error(err);
                            return mainMenu();
                        }
                    }
                    console.log('\x1b[33m%s\x1b[0m', `Department '${answers.newDeptName}' added to database.`);
                    return mainMenu();
                });
        })
        .catch(err => {
            if (err) {
                console.error(err);
                console.log("\nInquirer error detected. Returning to main menu...\n")
            } 
            return mainMenu();
        });
}


function createRole() {

    db.query(`SELECT * FROM departments;`, (err, results) => {
        if (err){
            console.error(err);
            console.log("\nQuery failed. Returning to main menu...\n");
            return mainMenu();
        }

        if (results.length === 0) { // IF THERE ARE NO DEPARTMENTS
            inquirer
                .prompt([
                    {
                        type: "list",
                        message: "There are no departments to add a role to. Create a department now?",
                        choices: ["Yes, create a department now", "No, go back to the main menu"],
                        name: "createDeptYesNo"
                    }
                ])
                .then((answers) => {
                    if (answers.createDeptYesNo === "Yes, create a department now") {
                        return createDepartment();
                    }
                })
                .catch((err) => {
                    if (err){
                        console.error(err);
                        console.log("\nInquirer error detected. Returning to main menu...\n");
                    }
                });
                return mainMenu();
        } else { // IF THERE ARE DEPARTMENTS
            // We need to get a list of departments first
            // so we can ask the user which department the new role belongs to.
            let departmentsList = [];
            for (let department of results) {
                departmentsList.push(department.name);
            }

            inquirer
                .prompt([
                    {
                        type: "input",
                        message: "New role title:",
                        name: "title"
                    },
                    {
                        type: "input",
                        message: "Salary for this role:",
                        name: "salary"
                    },
                    {
                        type: "list",
                        message: "Which department will have this role?",
                        choices: departmentsList,
                        name: "parentDepartment"
                    }
                ])
                .then((role) => {

                    // 'answers' holds just the user's inputs. Extracted from the 'role' object.
                    // This gives us an array, making it easy to check input validity.
                    let answers = Object.values(role);

                    // fields cannot be empty
                    if (answers.includes("")) {
                        console.log("Cannot accept empty field. Please try again.");
                        return createRole();
                    }

                    // I know we're already in a db.query, but we need to nest two more.
                    // Creating a role requires that we have the ID of its parent department.
                    // The only reliable way to get that ID is to run a query.
                    // In the callback of this query will be another query to insert the new role
                    // into the table.
                    db.query(`SELECT id FROM departments WHERE name='${role.parentDepartment}';`,
                        (err, results) => {
                            if (err) {
                                console.error(err);
                                console.log("\nQuery failed. Returning to main menu.\n");
                                return mainMenu();
                            } else if (results.length > 1) { // Two departments with the same id found. Bad news.
                                // background color red, foreground white
                                console.error("\x1b[41m\x1b[47m%s\x1b[0m", "ERROR: DUPLICATE DEPARTMENT IDs FOUND." + 
                                                                    "PLEASE MANUALLY SANITIZE THE DATABASE" +
                                                                    "BEFORE RUNNING THE CMS AGAIN.");
                                for (let department of results) {
                                    console.log(department); // logs all departments of this id
                                }
                                // Rather critical error. I'd rather the program stop running now.
                                return db.end();
                            } else {
                                // Results is an array, should only have one object,
                                // so we can safely hardcode this reference to position 0.
                                let departmentID = results[0].id;
                                db.query(`INSERT INTO roles
                                            VALUES (NULL,
                                                '${toTitleCase(role.title)}',
                                                ${parseFloat(role.salary)},
                                                ${departmentID}
                                            );`,
                                (err) => {
                                    if (err) {
                                        console.error(err);
                                        console.log("\nQuery failed. Returning to main menu...\n");
                                        return mainMenu();
                                    }

                                    // Yellow text for emphasis
                                    console.log('\x1b[33m%s\x1b[0m', `New role '${role.title}' added to database.`);
                                    return mainMenu();
                                });
                            }
                        }
                    );
                })
                .catch((err) => {
                    if (err) {
                        console.error(err);
                        console.log("\nInquirer error detected. Returning to main menu...\n");
                        return mainMenu();
                    }
                });
        }
    });
}


function createEmployee() {

    // Employee records must be linked to a role_id.
    // So, if there are no Roles in the database, don't allow the user to create an employee record.
    // We accomplish that by querying the roles table and only proceeding if there is at least one role record.
    db.query(`SELECT * FROM roles;`, (err, results) => {
        if (err){
            console.error(err);
            console.log("\nQuery failed. Returning to main menu...\n");
            return mainMenu();
        }
            
        if (results.length === 0) { // IF THERE ARE NO ROLES
            inquirer
                .prompt([
                    {
                        type: "list",
                        message: "There are no roles to add an employee to. Create a department now?",
                        choices: ["Yes, create a role now", "No, go back to the main menu"],
                        name: "createRoleYesNo"
                    }
                ])
                .then((answers) => {
                    if (answers.createRoleYesNo === "Yes, create a role now") {
                        return createRole();
                    }
                    
                    console.log("Returning to main menu...");
                    return mainMenu();
                })
                .catch((err) => {
                    if (err) console.error("\nInquirer error detected. Returning to main menu...\n");
                    return mainMenu();
                });
        } else { // IF THERE ARE ROLES
            // We need to get a list of roles first so we can ask the user which role the new employee has.
            // This is more sanitary than having the user manually type in the name of the role
            // and having to check for typos.
            let rolesList = [];
            for (let role of results) {
                rolesList.push(`${role.title} (ID: ${role.id})`);
            }

            // If there are no managers in the database, we can't ask if this new employee has a manager
            // because there will be no manager to link them to, and the INSERT command will fail.
            // To avoid that, we do a couple things. First, make a separate boolean
            // and use Inquirer's 'when' property to only ask 'does employee have manager'
            // when that boolean is true. We only set the boolean to false if there are no managers.
            // Second, if there are no managers, set `managerID` variable below to a string of value "NULL".
            // When the INSERT command runs, NULL will be passed in as the manager_id
            // and the command won't fail because manager_id CAN be null.
            let managersList = [];
            let askIfHasManager = false;
            db.query('SELECT * FROM employees WHERE is_manager=TRUE',
                (err, results) => {
                    if (err) {
                        console.error(err);
                        console.log("\nQuery failed. Returning to main menu...\n")
                        return mainMenu();
                    } else if (results.length === 0) {
                        // no managers found, set our boolean to false
                        askIfHasManager = false;

                        // Warn user. They can create the employee record, but there will be no manager
                        // tied to it. Also red text for emphasis.
                        console.log("\x1b[31m%s", "Warning: No managers found in the database.");
                        console.log("%s\x1b[0m", "This employee record will not be associated with a manager.");
                    } else {
                        // At least one manager found, Inquirer will prompt user to select
                        // which manager to tie to this new employee record.
                        askIfHasManager = true;
                    }

                    for (let employeeRecord of results) {
                        managersList.push(`${employeeRecord.first_name} ${employeeRecord.last_name} (ID: ${employeeRecord.id})`);
                    }

                    inquirer
                        .prompt([
                            {
                                type: "input",
                                message: "Employee's first name:",
                                name: "firstName"
                            },
                            {
                                type: "input",
                                message: "Employee's last name:",
                                name: "lastName"
                            },
                            {
                                type: "list",
                                message: "Is this employee a manager?",
                                choices: ["Yes", "No"],
                                name: "isManager"
                            },
                            {
                                type: "list",
                                message: "What is the new employee's role?",
                                choices: rolesList,
                                name: "role"
                            },
                            {
                                type: "list",
                                message: "Does this employee have a manager?",
                                choices: ["Yes", "No"],
                                when: () => askIfHasManager === true,
                                name: "hasManager"
                            },
                            {
                                type: "list",
                                message: "Who is this employee's manager?",
                                choices: managersList,
                                when: (employee) => employee.hasManager === "Yes",
                                name: "managerInfo"
                            }
                        ])
                        .then((employee) => {
                            // Convert the user-facing 'yes'/'no' into a database-facing 'true'/'false'
                            employee.isManager === "Yes" ? employee.isManager = true : employee.isManager = false;

                            // Some lazy trickery to get the manager and role IDs.
                            // I don't want to nest two more db queries just to get those numbers,
                            // so I baked their IDs into each string in rolesList[] and managersList[].
                            // All I have to do now is build a regex to extract the IDs from whichever
                            // strings the user selected for this employee's role and manager.
                            // Maybe not super elegant but it will save me from callback hell.
                            let idRegex = /(\d+)\)$/; // capture group grabs ONLY the ID itself

                            // Apply regex to role and manager strings to extract IDs
                            let roleID = employee.role.match(idRegex)[1]; // position 1 has the captured group
                            let managerID;
                            // If there aren't any managers in the db, managerID must be 'NULL'.
                            // This boolean can tell us if there are or aren't any managers in the db.
                            if (askIfHasManager) {
                                managerID = employee.managerInfo.match(idRegex)[1];
                            } else {
                                managerID = "NULL";
                            }

                            db.query(`INSERT INTO employees
                                        VALUES (NULL,
                                                '${toTitleCase(employee.firstName)}',
                                                '${toTitleCase(employee.lastName)}',
                                                ${employee.isManager},
                                                ${roleID},
                                                ${managerID});`,
                                (err) => {
                                    if (err) {
                                        console.error(err);
                                    } else {
                                        console.log('\x1b[33m%s\x1b[0m', `New employee '${toTitleCase(employee.firstName)} ${toTitleCase(employee.lastName)}' added to database.`);
                                    }
                                    mainMenu();
                                }
                            );
                        })
                        .catch((err) => {
                            if (err) {
                                console.error(err);
                                console.log("\nInquirer error detected. Returning to main menu...\n");
                                return mainMenu();
                            }
                        });
                });
        }
    });
}

function editEmployeeRole() {
    
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
    console.log("An easy-to-use CMS right in your favorite command line.");
    console.log("(To cancel any prompts, hit CTRL+C in the terminal and restart the program.)")
}