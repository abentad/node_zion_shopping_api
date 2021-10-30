const mysql = require('mysql');

//mysql connection
const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shopri',
    multipleStatements: true
});

mysqlConnection.connect((error)=>{
    if(error) console.log(error);
    else console.log('DB connected!');
});


module.exports = mysqlConnection;