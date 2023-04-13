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
            printTitleScreen(); // this is in a separate function just to avoid some clutter
            mainMenu(); // begin the inquirer chain
        });

function mainMenu() {
    
    console.log("\n-=<(  MAIN MENU  )>=-\n")

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
                    createEmployee();
                    break;

                case "Edit an employee role":
                    editEmployeeRole();
                    break;

                case "Exit":
                    console.log("Goodbye!");
                    db.end();
                    break;

                default:
                    console.log("Invalid value detected. Returning to main menu.");
                    mainMenu();
                    break;
            }
        })
        .catch((error) => {
            console.error(error);
        });
};


function viewAllDepartments() {
    db.query('SELECT * FROM departments;', (err, results) => {
        if (err) {
            return console.error(err);
        }
        if (results.length === 0) {
            // If we're here that means there are no departments in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no departments in the database to view.\nPlease select \"Add a department\" from the main menu.");
            mainMenu();
        } else {
            console.log(); // just an empty line for spacing
            console.table(results);
            mainMenu();
        }
    });
}

function viewAllRoles() {
    db.query('SELECT * FROM roles;', (err, results) => {
        if (err) {
            return console.error(err);
        }
        if (results.length === 0) {
            // If we're here that means there are no roles in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no roles in the database to view.\nPlease select \"Add a role\" from the main menu.");
            mainMenu();
        } else {
            console.log(); // just an empty line for spacing
            console.table(results);
            mainMenu();
        }
    });
}


function viewAllEmployees() {
    db.query('SELECT * FROM employees JOIN roles', (err, results) => {
        if (err) {
            return console.error(err);
        }
        if (results.length === 0) {
            // If we're here that means there are no employees in the database.
            // Print in red for better visibility.
            console.log("\x1b[31m%s\x1b[0m", "There are no employees in the database to view.\nPlease select \"Add an employee\" from the main menu.");
            mainMenu();
        } else {
            console.log(); // just an empty line for spacing
            console.table(results);
            mainMenu();
        }
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
            answers.newDeptName = toTitleCase(answers.newDeptName);
            db.query(`INSERT INTO departments
                      VALUES (NULL, "${answers.newDeptName}");`,
                (err) => {
                    if (err) {
                        console.error(err);
                        mainMenu();
                    } else {
                        console.log('\x1b[33m%s\x1b[0m', `Department '${answers.newDeptName}' added to database.`);
                        mainMenu();
                    }
                })
        })
        .catch(err => {
            if (err) console.error(err);
            mainMenu();
        })
}


function createRole() {

    db.query(`SELECT * FROM departments;`, (err, results) => {
        if (err){
            console.error(err);
            console.log("SELECT * FROM departments query failed. Returning to main menu.");
            mainMenu();
        } else {
            
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
                            createDepartment();
                        } else {
                            mainMenu();
                        }
                    })
                    .catch((err) => {
                        if (err) console.error(err);
                        mainMenu();
                    })
            } else { // IF THERE ARE DEPARTMENTS
                // We need to get a list of departments first so we can ask the user which department the new role belongs to.
                let rolesList = [];
                for (let department of results) {
                    rolesList.push(department.name);
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
                            choices: rolesList,
                            name: "parentDepartment"
                        }
                    ])
                    .then((role) => {
                        // FIXME: DICEY METHOD FOR FINDING THE DEPARTMENT_ID.
                        // This only works if we assume a department's 1-based position in this `rolesList` array
                        // is the same as its ID in the `departments` table.
                        // That won't be true if a department is ever deleted from the table, because the IDs
                        // obviously won't all just shift to fill the gap, and AUTO_INCREMENT won't automatically adjust
                        // if the deleted department was at the end of the table.
                        // I can keep this here for now, because there currently is no way for the user to delete a department,
                        // unless they open a mysql terminal and run a delete command themselves.
                        let departmentID = (rolesList.indexOf(role.parentDepartment) + 1);

                        // FIXME: Is it ok to run a db.query() INSIDE another db.query()'s callback like we're doing here?
                        db.query(`INSERT INTO roles
                                  VALUES (NULL,
                                          '${toTitleCase(role.title)}',
                                          ${parseFloat(role.salary)},
                                          ${departmentID});`,
                        (err, results) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('\x1b[33m%s\x1b[0m', `New role '${role.title}' added to database.`);
                            }
                            mainMenu();
                        })
                    })
                    .catch((err) => {
                        if (err) console.error(err);
                    })
            }
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
            console.log("SELECT * FROM roles query failed. Returning to main menu.");
            mainMenu();
        } else {
            
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
                            createRole();
                        } else {
                            mainMenu();
                        }
                    })
                    .catch((err) => {
                        if (err) console.error(err);
                        mainMenu();
                    })
            } else { // IF THERE ARE ROLES
                // We need to get a list of roles first so we can ask the user which role the new employee has.
                // This is more sanitary than having the user manually type in the name of the role and having to check for typos.
                let rolesList = [];
                for (let role of results) {
                    rolesList.push(role.title);
                }

                let managersList = [];
                // db.query('SELECT * FROM employees WHERE is_manager=1',
                //     (err, results) => {

                //     })

                // If there are no managers in the database, we can't ask if this new employee has a manager
                // because there will be no manager to link them to, and the INSERT command will fail.
                // To avoid that, we do a couple things. First, set a boolean to false and use Inquirer's 'when' property
                // to only ask if the employee has a manager when that boolean is true. We only set the boolean to false
                // if there are no managers. Second, set `managerID` variable below to a string of value "NULL".
                // When the INSERT command runs, NULL will be passed in as the manager_id and the command shouldn't fail.
                let askIfHasManager = false;

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
                            name: "managerName"
                        }
                    ])
                    .then((employee) => {
                        // Convert the user-facing 'yes'/'no' into a database-facing 'true'/'false'
                        employee.isManager === "Yes" ? employee.isManager = true : employee.isManager = false;

                        // FIXME: DICEY METHOD FOR FINDING THE ROLE_ID. (identical problem within the createRole() function above)
                        // This only works if we assume a role's 1-based position in this `rolesList` array
                        // is the same as its ID in the `roles` table.
                        // That won't be true if a role is ever deleted from the table, because the IDs
                        // obviously won't all just shift to fill the gap, and AUTO_INCREMENT won't automatically adjust
                        // if the deleted role was at the end of the table.
                        // I can keep this here for now, because there currently is no way for the user to delete a role,
                        // unless they open a mysql terminal and run a delete command themselves.
                        let roleID = (rolesList.indexOf(employee.role) + 1);
                        let managerID = (managersList.indexOf(employee.managerName) + 1);

                        // FIXME: Is it ok to run a db.query() INSIDE another db.query()'s callback like we're doing here?
                        db.query(`INSERT INTO employees
                                  VALUES (NULL,
                                          '${toTitleCase(employee.firstName)}',
                                          '${toTitleCase(employee.lastName)}',
                                          ${employee.isManager},
                                          ${roleID},
                                          NULL);`,
                        (err, results) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('\x1b[33m%s\x1b[0m', `New employee '${toTitleCase(employee.firstName)} ${toTitleCase(employee.lastName)}' added to database.`);
                            }
                            mainMenu();
                        })
                    })
                    .catch((err) => {
                        if (err) console.error(err);
                    })
            }
        }
    });
}

function editEmployeeRole() {
    db.end();
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