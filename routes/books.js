const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

const Book = require('../models').Book;

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}

/* GET books listing. */
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll({ order:[['createdAt',"DESC"]] });
  res.render("books/index", { books, title: "Library Manager" });
}));

/* Create a new book form. */
router.get('/new', (req, res) => {
  res.render("books/new", { book: {}, title: "New Book" });
});

/* POST create book. */
router.post('/', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books/");
  } catch (error) {
    if(error.name === "SequelizeValidationError") { // checking the error
      book = await Book.build(req.body);
      res.render("books/new", { book, errors: error.errors, title: "New Book" })
    } else {
      throw error; // error caught in the asyncHandler's catch block
    }  
  }
}));

/* Edit book form. */
router.post("/:id/edit", asyncHandler(async(req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render("books/edit", { book, title: "Edit Book" }); 
  } else {
    res.render('error', {error:{status:404}});
  }
}));

/* GET single book. */
router.get("/:id", asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render("books/show", { book, title: book.title });  
  } else {
    res.render('error', {error:{status:404}});
  }
}));


/* search books listing. */
router.get('/search/:term', asyncHandler(async (req, res) => {
  const books = await Book.findAll({
    where: {
      [Op.or]: [
        {genre:  {[Op.like]: '%' + req.params.term + '%' }}, 
        {title: {[Op.like]: '%' + req.params.term + '%' }},
        {author: {[Op.like]: '%' + req.params.term + '%' }},
        {year: {[Op.like]: '%' + req.params.term + '%' }},
      ]
    }
  })
  if(books) {
    res.render("books/index", { books, title: "Library Manager" });
  } else {
    res.render('error', {error:{status:404}});
  }
  
}));


/* Update book. */
router.post('/:id/', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      await book.update(req.body);
      res.redirect("/books/"); 
    } else {
      res.render('error', {error:{status:404}});
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id; // make sure correct article gets updated
      res.render("books/edit", { book, errors: error.errors, title: "Edit Book" })
    } else {
      throw error;
    }
  }
}));

/* Delete bookl. */
router.post('/:id/delete', asyncHandler(async (req ,res) => {
  const  book = await Book.findByPk(req.params.id);
  if(book) {
    await book.destroy();
    res.redirect("/books");
  } else {
    res.render('error', {error:{status:404}});
  }
}));

module.exports = router;