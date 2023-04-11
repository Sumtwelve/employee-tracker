const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');
const cTable = require('console.table');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    console.log(`Connected to ${process.env.DB_NAME} database.`)
);

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