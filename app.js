const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer =require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid= require('gridfs-stream');
const methodOverride = require('method-override');
const flash = require('connect-flash');
//const {check,validationResult} = require('express-validator');
const expressValidator = require('express-validator');
const session = require('express-session');
const app = express();

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
//Mongo URI
const mongoURI = 'mongodb://127.0.0.1:27017/mongouploads';
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



app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));



app.post('/upload', upload.single('file'), (req, res) => {
  //res.json({ file: req.file });
  res.redirect('/');
});


// app.get('/login',function(req,res){
//     res.render('login');
//   });



// app.post('/login', [
//   check('email', 'email is required').isEmail(),
//   check('password', 'password is required').not().isEmpty(),
//   ], function(req, res, next) {
//   //check validate data

//   const result= validationResult(req);
//   var errors = result.errors;
//   for (var key in errors) {
//         console.log(errors[key].value);
//   }
//   if (!result.isEmpty()) {
//      res.render('login', {
//       errors: errors
//     });
//  }
  // else{
  //   var email =req.body.email; 
  //   var pass = req.body.password; 

  //   conn.collection('signup').find({
  //       "email": email,"password":pass
  //   }).toArray((err,result)=>{
  //   if(!result || result.length == 0){
		// 	return res.status(404).json({
		// 		err:'No user Exist'
		// 	});
		// }
    
  //   else
  //    {
  //    	res.redirect('/');
  //    }
  //   });
  //   }
  // res.redirect('/');	
  // });
   


// app.get('/signup',function(req,res){
//     res.render('signup');
//   });


// app.post('/signup', function(req,res){ 
//     // var name = req.body.name;
//     //console.log(req.body.email) 
//     var email =req.body.email; 
//     var pass = req.body.password; 
//     // var phone =req.body.phone; 
  
//     var data = { 
//         "email":email, 
//         "password":pass, 
//     } 

// conn.collection('signup').insertOne(data,function(err, collection){ 
//         if (err) throw err; 
//         console.log("Record inserted Successfully"); 
              
//     });         
//     return res.redirect('login'); 
// });

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