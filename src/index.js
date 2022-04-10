require('dotenv').config();
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const port = 8080;
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const todoFilePath = process.env.BASE_JSON_PATH;

//Read todos from todos.json into variable

let todos = require(__dirname + todoFilePath);


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.raw());
app.use(bodyParser.json());

app.use("/content", express.static(path.join(__dirname, "public")));

app.get("/",function (req, res){
  res.status(200).sendFile("./public/index.html", { root: __dirname });
  //res.status(200).end();
});

app.get('/todos', (_, res) => {
  console.log(todoFilePath);
  res.header("Content-Type","application/json");
  res.status(200).sendFile(todoFilePath, { root: __dirname });
  //res.status(200).end();
});

//Add GET request with path '/todos/overdue'
// Add Get request with path 'todos/:id'
//Add GET request with path '/todos/completed'
app.get("/todos/:id",function(req,res){
  const unknown = req.params.id;
  //console.log(unknown)
  if(unknown === 'completed'){
    //console.log('This is completed');
    const completedTodos = [];
    todos.forEach(function(stat){
      if(stat.completed === true){
        //console.log(stat);
        completedTodos.push(stat)
        }
    });
    res.status(200).send(completedTodos)
    return;
  } else if (unknown === 'overdue') {
    console.log('overdue');
    const overdue = [];
    const today = new Date();
    //console.log(todos[0].completed);
    todos.forEach(function(num){
      if(today > new Date(num.due)){
        //console.log(num)
        overdue.push(num)
      }
    });
    res.status(200).send(overdue);
    return;
  } else {
    const specialId = req.params.id;
    //console.log(req.params)
    console.log('id issue');
    const specifiedId = todos.some(todo => todo.id === specialId);
    if(!specifiedId){
      res.status(400).send('Bad request')
    } else {
      const specific = todos.filter(todo => todo.id === specialId);
      console.log(specific)
      res.status(200).send(specific).end();
    }
  }
});




//Add a new todo to the todo list
//Add POST request with path '/todos'
app.post('/todos', function(req, res){
  const newTodo = {
    id: uuidv4(), // this needs to be something THAT IS CONSTANTLY changed
    name: req.body.name,
    created: new Date(),
    due: req.body.due,
    completed: false
  };
  if (!req.body.name && !req.body.due){
    res.status(400).send('Incorrect data submitted');
    return;
  }
  todos.push(newTodo);
  //console.log(newTodo)
  //console.log(todos)
  const TodoJSON = JSON.stringify(todos, null, 2);
  console.log(TodoJSON)
  fs.writeFile(__dirname + process.env.BASE_JSON_PATH,  TodoJSON, err => {
      if (err) {
        console.error(err);
        return;
      }
       else {
      //   console.log(todos);
      console.log(fs.readFileSync(__dirname + process.env.BASE_JSON_PATH, "utf8"));
      res.status(201).send('Created');
      }
    });

});

// Edit the `name` and/or `due` date attributes of a todo.
//Add PATCH request with path '/todos/:id
app.patch('/todos/:id', function(req, res){
  const patchTodo = req.body
  const todoId = todos.some(todo => todo.id === req.params.id);
  const patchMatchName = patchTodo.hasOwnProperty('name');
  const patchMatchDue = patchTodo.hasOwnProperty('due')
  if(!todoId){
    //console.log('intev');
    res.status(400).send('Bad request');
    return;
  } else if(todoId && !patchMatchName && !patchMatchDue){
    //console.log('situation 2')
    res.status(400).send('Bad request');
    return;
  } else {
    //console.log('last situation');
    let match = todos.find(todo => todo.id === req.params.id);
    let otherTodos = todos.filter(todo => todo.id !== req.params.id);
    if(patchMatchName){
      match.name = req.body.name;
    }
    if(patchMatchDue){
      match.due = req.body.due;
    }
    otherTodos.push(match);
    const updatedJSON = JSON.stringify(otherTodos, null, 2);
    fs.writeFile(__dirname + process.env.BASE_JSON_PATH,  updatedJSON, err => {
      if (err) {
        console.error(err);
        return;
      }else {
        res.status(200).send('Ok');
      }
    });

 }
});

// Update todo, set attribute complete to `true`
//Add POST request with path '/todos/:id/complete
app.post("/todos/:id/complete", function(req, res){
  const completeId = req.params.id;
  const completeToTrue = todos.some(todo => todo.id === completeId);
  if(!completeToTrue){
    res.status(400).send('Bad request');
  } else {
    let complete = todos.find(todo => todo.id === completeId);
    let unfiltered = todos.filter(todo => todo.id !== completeId);
    //console.log(complete);
    complete.completed = true;
    //console.log(complete);
    unfiltered.push(complete);
    const completeJSON = JSON.stringify(unfiltered, null, 2);
    //console.log(__dirname + process.env.BASE_JSON_PATH);
    //console.log(TodoJSON)
    fs.writeFile(__dirname + process.env.BASE_JSON_PATH,  completeJSON, err => {
        if (err) {
          console.error(err);
          return;
        }else {
        // console.log(updatedJSON);
        // console.log(fs.readFileSync(__dirname + process.env.BASE_JSON_PATH, "utf8"));
        res.status(200).send('Ok');
        }
      });
  }
});


//Update todo, set attribute complete to `false`
//Add POST request with path '/todos/:id/undo
app.post("/todos/:id/undo", function(req, res){
  const undoId = req.params.id;
  const toUndo = todos.some(todo => todo.id === undoId);
  if(!toUndo){
    res.status(400).send('Bad request');
  } else {
    let undo = todos.find(todo => todo.id === undoId);
    let others = todos.filter(todo => todo.id !== undoId);
    //console.log(undo);
    undo.completed = false;
    //console.log(undo);
    others.push(undo)
    const undoJSON = JSON.stringify(others, null, 2);
    fs.writeFile(__dirname + process.env.BASE_JSON_PATH,  undoJSON, err => {
        if (err) {
          console.error(err);
          return;
        }else {
          // console.log(todos);
          // console.log(fs.readFileSync(__dirname + process.env.BASE_JSON_PATH, "utf8"));
          res.status(200).send('Ok');
        }
      });

  }
});


//Deletes a todo by `id`
//Add DELETE request with path '/todos/:id
app.delete("/todos/:id/", function(req, res){
  const deleteId = req.params.id;
  const toDelete = todos.some(todo => todo.id === deleteId);
  //console.log(fs.readFileSync(__dirname + process.env.BASE_JSON_PATH, "utf8"))
  if(!toDelete){
    res.status(400).send('Bad request');
  } else {
      //console.log('it works');
      let collectionTodos = todos.filter(todo => todo.id !== deleteId);
      const remainingJSON = JSON.stringify(collectionTodos, null, 2);
      //console.log(remainingJSON)
      fs.writeFile(__dirname + process.env.BASE_JSON_PATH,  remainingJSON, err => {
          if (err) {
            console.error(err);
            return;
          }else {
            // console.log(todos);
            // console.log(fs.readFileSync(__dirname + process.env.BASE_JSON_PATH, "utf8"));
            res.status(200).send('Ok');
          }
    });
  }
});

app.listen(port, function () {
  console.log(`Node server is running... http://localhost:${port}`);
});

module.exports = app;