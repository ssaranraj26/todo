const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const authenticationToken = (request, response, next) => {
  let jwtToken;
  const authHead = request.headers["authorization"];
  if (authHead !== undefined) {
    jwtToken = authHead.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(400);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "SECRET_KEY", (error, payload) => {
      if (error) {
        response.status(400);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const validTodoStatus = (status) => {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return true;
  } else {
    return false;
  }
};

const validTodoPriority = (priority) => {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return true;
  } else {
    return false;
  }
};
const validTodoCategory = (category) => {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return true;
  } else {
    return false;
  }
};
const checkForValid = (requestBody) => {
  return (
    validTodoStatus(requestBody.status) &&
    validTodoPriority(requestBody.priority) &&
    validTodoCategory(requestBody.category)
  );
};

app.get("/todos/", async (request, response) => {
  const {
    search_q = "",
    todo,
    priority,
    status,
    category,
    dueDate,
  } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      data = await database.all(getTodosQuery);
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      data = await database.all(getTodosQuery);
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`;
      data = await database.all(getTodosQuery);
      break;
    case hasStatus(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      data = await database.all(getTodosQuery);
      if (data === undefined) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      data = await database.all(getTodosQuery);
      if (data === undefined) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      data = await database.all(getTodosQuery);
      if (data === undefined) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
  }
  response.send(data);
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    SELECT *
    FROM todo
    WHERE id = '${todoId}'`;
  const dbData = await database.get(query);
  response.send(dbData);
});

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  date = new Date(date);
  date = format(date, "yyyy-MM-dd");
  console.log(date);
  const query = `
    SELECT *
    FROM todo
    WHERE due_date = ${date}`;
  const dbData = await database.all(query);
  response.send(dbData);
});

app.post("/todos/", async (request, response) => {
  const requestBody = request.body;
  const valid = checkForValid(requestBody);
  const query = `
    INSERT INTO todo(id, todo,priority,status,category, due_date)
    VALUES('${id}', '${todo}','${priority}','${status}','${category}', '${dueDate}')`;
  await database.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateCol;
  let value;
  let text;
  const { todo, priority, status, category, dueDate } = request.body;
  switch (true) {
    case todo !== undefined:
      updateCol = "todo";
      value = todo;
      text = "Todo";
      break;
    case priority !== undefined:
      updateCol = "priority";
      value = priority;
      text = "Priority";
      break;
    case status !== undefined:
      updateCol = "status";
      value = status;
      text = "Status";
      break;
    case category !== undefined:
      updateCol = "category";
      value = category;
      text = "Category";
      break;
    case dueDate !== undefined:
      updateCol = "due_date";
      value = dueDate;
      text = "Due Date";
      break;
  }
  const query = `
  UPDATE todo
  SET '${updateCol}'= '${value}'
  WHERE id=${todoId}`;
  await database.run(query);
  response.send(`${text} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
