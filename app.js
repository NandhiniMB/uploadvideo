const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer =require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid= require('gridfs-stream');
const methodOverride = require('method-override');
//const flash = require('connect-flash');
//const {check,validationResult} = require('express-validator');
const expressValidator = require('express-validator');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('req-flash');

const app = express();
const passport = require('passport');
const config = require('./config/database');

//Middleware

app.use(bodyParser.json());
app.use(express.static('public')); 
app.use(bodyParser.urlencoded({ 
    extended: true
})); 
app.use(expressValidator())
app.use(methodOverride('_method'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs')
app.use(bodyParser());
//Mongo URI
const mongoURI = config.database;
//Create connection
const conn= mongoose.createConnection(mongoURI);
let gfs;
conn.once('open',() => {
	console.log("connected to mongodb");
	gfs=Grid(conn.db,mongoose.mongo);
	gfs.collection('uploads');
	gfs.collection('User');
})


conn.on('error',function(err){
	console.log(err);
});

//create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage })


app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());


require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.post('/upload', upload.single('file'), (req, res) => {
  //res.json({ file: req.file });
  res.redirect('/');
});


app.get('/',(req,res) => {
    var query_video={contentType : 'video/mp4'};
	gfs.files.find(query_video).toArray((err,files)=>{
		if(!files || files.length == 0){
		     res.render('index',{files:false});	
		}
		else
		{
			res.render('index',{files:files});
		}
		//return res.json(files);
	});

});


app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});	


// app.get('/*', function(req, res, next){
//   res.session.flash = [];
//   next();
// });



// @route GET /files
app.get('/files',(req,res)=>{
	gfs.files.find().toArray((err,files)=>{
		if(!files || files.length == 0){
			return res.status(404).json({
				err:'No Files Exist'
			});
		}
		return res.json(files);
	});
});

app.get('/files/:filename',(req,res)=>{
	gfs.files.findOne({filename: req.params.filename},(err,files) => {
	if(!files || files.length == 0){
			return res.status(404).json({
				err:'No Files Exist'
			});
		}
		return res.json(files);	
	});
});

app.get('/video/:filename',(req,res)=>{
	gfs.files.findOne({filename: req.params.filename},(err,file) => {
	if(!file || file.length == 0){
			return res.status(404).json({
				err:'No Files Exist'
			});
		}
		//return res.json(files);
		if(file.contentType == 'video/mp4')	{
			//read output to browser
			const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
		}
		else
		{
			res.status(404).json({
				err:'Not an video'
			});
		}
	});
});

app.delete('/files/:id',(req,res) =>{
	gfs.remove({_id:req.params.id, root: 'uploads'},(err,gridStore)=>{
		if(err){
			return res.status(404).json({err:'No file to delete'});
		}
		res.redirect('/');
    });
});
//const User=require('./models/User');
let users = require('./routes/user');
app.use('/users', users);

const port = 5000;
app.listen(port, () => console.log(`server started on port ${port}`));