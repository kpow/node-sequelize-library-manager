const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

const Book = require('../models').Book;

/* variables for pagination*/
const pageLimit = 5;
let currentPage = 0;
let currentOffset = 0;
let totalPageCount = 0;

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
  const { count } = await Book.findAndCountAll();
  currentPage = 1
  totalPageCount = Math.ceil(count/pageLimit)
  res.redirect("books/page/1")
 
}));

router.get('/page/:page', asyncHandler(async (req, res) => {
  currentPage = req.params.page
  currentOffset = (currentPage-1)*pageLimit;
  const books = await Book.findAll({ order:[['title',"ASC"]],limit:pageLimit, offset:currentOffset });
  res.render("books/index", { books, currentPage, totalPageCount });
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
    res.redirect("/");
  } catch (error) {
    if(error.name === "SequelizeValidationError") { 
      book = await Book.build(req.body);
      // displays validation error
      res.render("books/new", { book, errors: error.errors, title: "New Book" })
    } else {
      // this will push asynchandler function to error
      throw error; 
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
router.get('/search/:term/:page?', asyncHandler(async (req, res) => {
  
  // sets current page from url, if none goes to 1
  req.params.page ? currentPage = req.params.page : currentPage = 1
  currentOffset = (currentPage-1)*pageLimit;

  const {count, rows} = await Book.findAndCountAll({
    order:[['title',"ASC"]],
    limit:pageLimit, offset:currentOffset,
    where: {
      [Op.or]: [
        {genre:  {[Op.like]: '%' + req.params.term + '%' }},
        {title: {[Op.like]: '%' + req.params.term + '%' }},
        {author: {[Op.like]: '%' + req.params.term + '%' }},
        {year: {[Op.like]: '%' + req.params.term + '%' }},
      ]
    }
  })
  // figure out how many pages based on return and page limit
  totalPageCount = Math.ceil(count/pageLimit)
  const search = req.params.term;
  const books = rows

  if(books) {
    res.render("books/index", { books, search, currentPage, totalPageCount});
  } else {
    res.render('error', {error:{status:500}});
  }
}));

/* Edit book form. */
router.post("/search", asyncHandler(async(req, res) => {
  if(req.body.term) {
    res.redirect("search/"+req.body.term+"/1"); 
  } else {
    res.redirect("/"); 
  }
}));


/* Update book. */
router.post('/:id/', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      await book.update(req.body);
      res.redirect("/books/page/1"); 
    } else {
      res.render('error', {error:{status:404}});
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id; // make sure correct book gets updated
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