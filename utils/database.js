const {createPool} = require('mysql');

//mysql connection
// const mysqlConnection = createPool({
//     port: 3306,
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'shopri',
//     connectTimeout: 10
// });

const mysqlConnection = createPool({
    port: 3306,
    host: "localhost",
    user: "rentochcom_david",
    password: "y]~eHw@E*b$%",
    database: "rentochcom_shopri",
    connectTimeout: 10
});

// mysqlConnection.connect((error)=>{
//     if(error) console.log(error);
//     else console.log('DB connected!');
// });


module.exports = mysqlConnection;