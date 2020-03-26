const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer =require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid= require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs')

//Mongo URI
const mongoURI = 'mongodb://127.0.0.1:27017/mongouploads';
//Create connection
const conn= mongoose.createConnection(mongoURI);
let gfs;
conn.once('open',() => {
	gfs=Grid(conn.db,mongoose.mongo);
	gfs.collection('uploads');
})

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
app.get('/',(req,res) => {

	res.render('index');

});
app.post('/upload', upload.single('file'), (req, res) => {
  //res.json({ file: req.file });
  res.redirect('/');
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

const port = 5000;
app.listen(port, () => console.log(`server started on port ${port}`));