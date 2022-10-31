const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

module.exports = function(app, shopData) {

    //Redirect Login
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
        res.redirect('./login')
        } else { next (); }
        } 

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search', redirectLogin, function(req,res){
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', [check('keyword').not().isEmpty().isLength({min:1, max:25})], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        res.redirect('./search'); }
        else {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);
        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });

        }
    });

    //Back to home
    app.get('/', function(req,res) {
        res.render('index.ejs', shopData);
    });

    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });

    //Registered
    app.post('/registered', [check('email').isEmail()], [check('password').not().isEmpty().isLength({min:8, max:40})], [check('username').not().isEmpty().isLength({min:1, max:25})], [check('first').not().isEmpty().isLength({min:1, max:25})], [check('last').not().isEmpty().isLength({min:1, max:25})], function (req, res) {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./register');
            }else{

        const saltRounds = 10; 
        const plainPassword = req.body.password;



        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
        
    // saving data in database
	let sqlquery = "INSERT INTO accounts (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
    
	// execute sql query
	let newrecord = [req.sanitize(req.body.username), req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email), req.sanitize(hashedPassword)];

    console.log(req.body.username);
	db.query(sqlquery, newrecord, (err, result) => {
	if (err) {
	return console.error(err.message);
	}
	else
        result = 'Hello '+ req.sanitize(req.body.first) + ' ' + req.sanitize(req.body.last) +' you are now registered! We will send an email to you at ' + req.sanitize(req.body.email); result += ' Your password is: '+ req.sanitize(req.body.password) +' and your hashed password is: '+ req.sanitize(hashedPassword); res.send(result + '<p><a href='+'./'+'>Home</a></p>');
	}); 
    })
    }
    });
     

    app.get('/deleteuser', redirectLogin, function (req,res) {
        res.render('deleteuser.ejs', shopData);                                                                     
    });

    //EXTENSION:
    //DELETE RESULT
    app.post('/deleteresult', [check('username').not().isEmpty().isLength({min:1, max:25})], function (req,res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        res.redirect('./deleteuser'); }
        
        else {

    // deleting row from the accounts table where the username matches
	let sqlquery = "DELETE FROM accounts WHERE username = '" + req.body.username + "'";
    let newrecord = [req.sanitize(req.body.username)];

	// execute sql query
    console.log(req.body.username);
	db.query(sqlquery, newrecord, (err, result) => {
	    if(err) {
            console.log("Error: cannot get user from database");
	        return console.error(err.message);
        }else if(req.body.username == "") {
            //checking empty fields
            res.send('Field cannot be empty' + '<p><a href='+'./'+'>Home</a></p>');
	    }
        else if(result.affectedRows == 0){
            result = 'User not found' + '<p><a href='+'./'+'>Home</a></p>';
            res.send(result);
        }
        else{
            result = 'User '+ req.sanitize(req.body.username) + ' successfully deleted' + '<p><a href='+'./'+'>Home</a></p>';
            res.send(result);
    }
	});
    }
    }); 

    app.get('/login', function (req,res) {
        res.render('login.ejs', shopData);                                                                     
    });

    //Logged in
    app.post('/loggedin', [check('password').not().isEmpty().isLength({min:8, max:40})], [check('username').not().isEmpty().isLength({min:1, max:25})], function (req,res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./login'); }

        else {


        let sqlquery = "SELECT hashedPassword FROM accounts WHERE username = '"+req.body.username+"'";
        db.query(sqlquery, (err, result) => {
            console.log(result)

        if(err){
        //TODO: Handle error
        console.log("error")
        res.redirect('./');
        }
        else if (result.length == 0){
            console.log("error1")
            res.send('Username entered is incorrect' + '<p><a href='+'./'+'>Home</a></p>')
        }
        else {
            let hashedPassword = result[0].hashedPassword;

            bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
                if(err){
                    console.log("error" + hashedPassword);
                    res.redirect('./');
                }
                else if(result == true){
                    // Save user session here, when login is successful
                    req.session.userId = req.sanitize(req.body.username); 
                    console.log(req.body.username + " is logged in successfully!")
                    res.send(req.sanitize(req.body.username) + ' is logged in' + '<p><a href='+'./'+'>Home</a></p>')
                }
                else{
                    console.log("Incorrect password" + hashedPassword)
                    res.send('Password is incorrect' + '' + ' please try again!' + '<p><a href='+'./'+'>Home</a></p>')
                    }
                })
            }
        });
    }
    });

    app.get('/list', redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });

    //List all users
    app.get('/listusers', redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM accounts"; // query database to get all the users
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newDataUsers = Object.assign({}, shopData, {availableUsers:result});
            console.log(newDataUsers)
            res.render("listusers.ejs", newDataUsers)
         });
    });


    app.get('/addbook', redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
     });
 
     app.post('/bookadded', [check('name').not().isEmpty().isLength({min:1, max:25})], [check('price').not().isEmpty().isLength({min:1, max:20})], function (req,res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        res.redirect('./addbook'); }

        else {
        
            // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.sanitize(req.body.name) + ' price '+ req.sanitize(req.body.price) + '<p><a href='+'./'+'>Home</a></p>');
             });
            }
       });    

       app.get('/bargainbooks', redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });  
    
    app.get('/logout', redirectLogin, (req,res) => {
        req.session.destroy(err => {
        if (err) {
        return res.redirect('./')
        }
        res.send('you are now logged out. <a href='+'./'+'>Home</a>');
        })
        })
}
