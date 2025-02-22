require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
const corsOptions = {
  origin: ["https://donezo-e4856.web.app", "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.khcvy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("TODO-DB");
    const userCollections = db.collection("Users");
    const taskCollections = db.collection("Tasks");

    // // Create indexes
    await taskCollections.createIndex({ category: 1, order: 1 });
    await taskCollections.createIndex({ updatedAt: -1 });

    // API: post user data
    app.post("/add-users", async (req, res) => {
      const userData = req.body;

      // check if the data already in user DB
      const query = { email: userData.email };
      const isExists = await userCollections.findOne(query);

      if (isExists) {
        return res
          .status(409)
          .json({ message: "Data already ache! save korar dorkar nai." });
      } else {
        const result = await userCollections.insertOne(userData);
        res.send(result);
      }
    });

    // API: fetch user data through email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollections.findOne(query);
      res.send(result);
    });

    // API: post a task
    app.post("/add-tasks", async (req, res) => {
      const taskData = req.body;

      const result = await taskCollections.insertOne(taskData);
      res.send(result);
    });

    // API: get task data user email category and list
    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);

      try {
        const tasks = await taskCollections
          .aggregate([
            { $match: { email: email } }, 
            {
              $group: {
                _id: "$category",
                tasks: { $push: "$$ROOT" },
              },
            },
            {
              $addFields: {
                sortOrder: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$_id", "todo"] }, then: 1 },
                      { case: { $eq: ["$_id", "inprogress"] }, then: 2 }, 
                      { case: { $eq: ["$_id", "done"] }, then: 3 },
                    ],
                    default: 4,
                  },
                },
              },
            },
            { $sort: { sortOrder: 1 } },
            {
              $project: {
                _id: 0,
                category: "$_id",
                tasks: 1,
              },
            },
          ])
          .toArray();

        const categories = ["todo", "inprogress", "done"];

        const formattedTasks = categories.map((category) => {
          const categoryTasks = tasks.find(
            (task) => task.category === category
          );

          return {
            category,
            tasks: categoryTasks ? categoryTasks.tasks : [],
          };
        });

        res.status(200).json({
          success: true,
          error: false,
          message: "Tasks retrieved successfully",
          data: formattedTasks,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: true,
          message: "Failed to retrieve tasks",
        });
      }
    });

    // Update task title and description
    app.put("/task-update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { title, description } = req.body;

        const updateFields = {};
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;

        const result = await taskCollections.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: "Task not found" });
        }

        res.status(200).send({ message: "Task updated successfully", result });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).send({ error: "Failed to update task" });
      }
    });

    // update category for drag and drop
    app.put("/tasks/dnd/:_id", async (req, res) => {
      const id = req.params?._id;
      const task = req.body;

      if (!task || !id) {
        return res.status(404).send({
          error: true,
          message: "task not found",
        });
      }
      task.modified = new Date(task.modified);
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: { category: task.category, modified: task.modified },
      };

      try {
        const result = await taskCollections.findOneAndUpdate(
          filter,
          updateDoc,
          { upsert: true, returnDocument: "after" }
        );
        res.status(201).send({
          success: true,
          error: false,
          message: "Successfully updated the task",
          data: result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          error: true,
          message: "Failed to update task",
        });
      }
    });

    // API: Delete task data with their _id
    app.delete("/task-del/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const query = { _id: new ObjectId(id) };

      try {
        const result = await taskCollections.deleteOne(query);
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Task deleted successfully" });
        } else {
          res.status(404).json({ error: "Task not found" });
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Failed to delete task" });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
  }

}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the DoneZo TODO app backend");
});

app.listen(port, () => {
  console.log(`TODO App listening on port ${port}`);
});
