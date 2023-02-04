const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB", (err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("Connected");
  }
});

const itemSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const Items = mongoose.model("Items", itemSchema);
const Lists = mongoose.model("Lists", listSchema);

const item1 = new Items({ name: "Welcome to your todolist" });
const item2 = new Items({ name: "Hit the + button to add a new item" });
const item3 = new Items({ name: "<-- Hit this delete an item" });

app.get("/", (req, res) => {
  const day = date.getDate();
  Items.find({}, "name", (err, foundItems) => {
    if (err) {
      console.log(err.message);
    } else {
      if (foundItems.length <= 0) {
        Items.insertMany([item1, item2, item3], (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("success");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { kindOfDay: day, newListItem: foundItems });
      }
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  Lists.findOne({ name: customListName }, (err, docs) => {
    if (!err) {
      if (docs) {
        res.render("list", {
          kindOfDay: docs.name,
          newListItem: docs.items,
        });
      } else {
        const list = new Lists({
          name: customListName,
          items: [item1, item2, item3],
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
  });
});

app.post("/", function (req, res) {
  const day = date.getDate();
  const todo = new Items({ name: req.body.newItem });
  const listTitle = req.body.button;

  if (listTitle.trim() == day.trim()) {
    todo.save();
    res.redirect("/");
  } else {
    Lists.findOne({ name: listTitle.trim() }, (err, docs) => {
      if (!err) {
        docs.items.push(todo);
        docs.save();
        res.redirect("/" + listTitle.trim());
      } else {
        console.log(err.message);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const day = date.getDate();
  const checkedID = req.body.checkbox;
  const listTitle = req.body.listTitle;

  if (listTitle.trim() == day.trim()) {
    Items.findByIdAndDelete(checkedID.trim(), (err) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log("deleted ", checkedID);
      }
    });
    res.redirect("/");
  } else {
    Lists.findOneAndUpdate(
      { name: listTitle.trim() },
      { $pull: { items: { _id: checkedID.trim() } } },
      (err) => {
        if (!err) {
          console.log("deleted ", checkedID);
          res.redirect("/" + listTitle.trim());
        } else {
          console.log(err.message);
        }
      }
    );
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
