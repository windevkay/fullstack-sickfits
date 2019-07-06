const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();
//use express middleware to handle cookies (jwt)
server.express.use(cookieParser());//will allow us to parse cookies to get JWT and authorize user 
//decode jwt so we can access user id in each request 
server.express.use((req, res, next) => {
    //pull the token out of the request
    const {token} = req.cookies;
    //decode the user id 
    if(token){
        const {userId} = jwt.verify(token, process.env.APP_SECRET);
        //tag that userid to the requests for all further requests
        req.userId = userId;
    }
    next();
});
//use express middleware to populate current user
server.express.use(async (req, res, next) => {
    //if there is no user logged in then skip this
    if(!req.userId) return next();
    //else get the user 
    const user = await db.query.user({where: {id: req.userId}}, '{id, name, permissions, email}');
    //tag the user and its associated fields on to the request 
    req.user = user;
    next();
});

server.start({
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL
    }
}, serve => {
    console.log(`Server is now running on port ${serve.port}`);
});
