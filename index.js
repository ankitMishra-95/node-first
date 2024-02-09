import { log } from 'console';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { name } from 'ejs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

mongoose.connect("mongodb://localhost:27017", {
    dbName: 'Backend',
}).then(()=> {
    console.log("database connection established");
}).catch(err => {console.log(err);})

// const messageSchema = mongoose.Schema({
//     name:String, email:String
// })

const authSchema = mongoose.Schema({
    name:String, email:String, password:String
})

// const AllUsers = mongoose.model("users", messageSchema);

const AuthUsers = mongoose.model("AuthUser", authSchema);

const app = express();

// using middlewares
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({extended: true}));
app.use(cookieParser())

const users = [];

// setting up view engine
app.set('view engine', 'ejs');

const isAuthenticated = async (req, res, next) => {
    const {token} = req.cookies;
    if(token) {
        const decoded = jwt.verify(token, "dfkhbdvbhvbhbfvhb");
        console.log(decoded._id);
        req.user = await AuthUsers.findById(decoded._id);  
        next()
    } else {
        res.redirect("/login")
    }
}

app.get('/', isAuthenticated, (req, res) => {
    console.log(req.user);
    res.render('logout', {name: req.user.name});
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    let user = await AuthUsers.findOne({email});
    if(!user) return res.redirect("/register");
    // const isUserExist = user.password === password;
    const isUserExist = await bcrypt.compare(password, user.password);
    if(!isUserExist) {
        return res.render("login", {message: "Incorrect Password", email})
    }
    const token = jwt.sign({_id:user._id}, "dfkhbdvbhvbhbfvhb")
    // console.log(token);
    res.cookie("token", token, {
        httpOnly: true, expires: new Date(Date.now() + 60* 1000)
    });
    res.redirect('/');
})

app.post('/register', async (req, res) => {
    const {name, email, password} = req.body

    const checkUser = await AuthUsers.findOne({email});

    if(checkUser) {
        return res.redirect('/login')
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await AuthUsers.create({name, email, password:hashedPassword})

    const token = jwt.sign({_id:user._id}, "dfkhbdvbhvbhbfvhb")
    // console.log(token);
    res.cookie("token", token, {
        httpOnly: true, expires: new Date(Date.now() + 60* 1000)
    });
    res.redirect('/');
})

app.get('/logout', (req, res) => {
    res.cookie("token", null, {
        httpOnly: true, expires: new Date(Date.now())
    });
    res.redirect('/');
})

// app.get('/success', (req, res) => {
//    res.render('success', {greeting: 'Hello world!'});
// });
// app.get('/add', async (req, res) => {
//     // AllUsers.create({
//     //     name: "Ankit Mishra", email: "ankit@gmail.com"
//     // }).then(() => {
//     //     res.send("Added")
//     // })
//     await AllUsers.create({name: "Ankit Mishra", email: "ankit@gmail.com"})
//     res.send("Added")
// });

// app.post('/contact', async (req, res) => {
//     const {name, email} = req.body;
//     await AllUsers.create({name, email});
//     res.redirect("/success")
// })

// app.get('/users', (req, res) => {
//     res.json({users});
// })

app.listen(5000, (err, res) => {
    console.log("Server listening on port " +  5000);
})