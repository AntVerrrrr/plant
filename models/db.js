const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: 'jhs20191157!', 
  database: 'plant',
  port: '3306'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to the database!");
});

module.exports = connection;
