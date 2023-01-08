const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connecting to mongod server

mongoose.set('strictQuery', false);
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect("mongodb+srv://admin-piyush:piyush123@cluster0.8ogktpw.mongodb.net/todolistDB");
  console.log("Connected to mongodb server");
}

//Creating item schema
const itemSchema = new mongoose.Schema({
  name: String
});
//Creating List schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

//Creating model of items collection
const Item = mongoose.model("Item", itemSchema);

//Creating model of List collection
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Buy Food",
})
const item2 = new Item({
  name: "Cook Food",
})
const item3 = new Item({
  name: "Eat Food",
})

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {

  const day = date.getDate();

  Item.find({}, function (err, fountItems) {

    if (fountItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log("Successfully saved default items to DB.")
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: fountItems });
    }

  });


});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);//first letter capital and all other latters small
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list using default list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list 
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  })
})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === date.getDate()) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === date.getDate()) {
    Item.findByIdAndDelete(itemId, function (err) {
      if (!err) console.log("successfully deleted checked item");
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull:{items: {_id: itemId}}},function(err,foundList){
      res.redirect("/"+listName);
    })
  }


})

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
