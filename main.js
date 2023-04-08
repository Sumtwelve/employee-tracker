const inquirer = require('inquirer');
const cTable = require('console.table');

// wanted to make this somewhat fancy so here's a fancy logo
// I put it into a separate function to reduce clutter
printLogo();
console.log("Welcome to Sumtwelve's Employee Tracker!");
console.log("An easy-to-use CMS right in your favorite command line.")
console.log("\n[ MAIN MENU ]\n")

inquirer
    .prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: ["View all departments", "View all roles", "View all employees", "Add a department", "Add a role", "Add an employee", "Update an employee role"],
            name: "mainMenuSelection"
        },
        {
            
        }
    ])
    .then((answers) => {

    })
    .catch((error) => {
        console.error(error);
    });



function printLogo() {
    console.log(" _______________________________________");
    console.log("|\\______________________________________\\");
    console.log("||                                       |");
    console.log("||    E M P L O Y E E    T R A C K E R   |");
    console.log("\\|_______________________________________|\n");
}