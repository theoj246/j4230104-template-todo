import fs from "node:fs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));
const prisma = new PrismaClient();

const template = fs.readFileSync("./template.html", "utf-8");
app.get("/", async (request, response) => {
  const user = await prisma.user.findFirst(); // Assuming there's only one user
  if (user) {
    const todos = await prisma.todo.findMany({
      where: { user: user.username }
    });
    const html = template
      .replace(
        "<!-- todos -->",
        todos
          .map(
            (todo) => {
              const timeLeft = Math.max(0, new Date(todo.date) - new Date());
              const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
              return `
                <li>
                  <span>${escapeHTML(todo.title)}</span>
                  <span>(${new Date(todo.date).toLocaleString()})</span>
                  <span><b>${daysLeft} 日前</b></span>
                  <form method="post" action="/update-done" class="update-done-form">
                    <input type="hidden" name="id" value="${todo.id}" />
                    <input type="checkbox" name="done" value="true" ${todo.done ? 'checked' : ''} onclick="this.form.submit()">
                  </form>
                </li>
              `;
            }
          )
          .join(""),
      )
      .replace(/<!-- username -->/g, escapeHTML(user.username));
    response.send(html);
  } else {
    response.send(template.replace(/<!-- todos -->/g, "").replace(/<!-- username -->/g, ""));
  }
});

app.post("/create", async (request, response) => {
  const user = await prisma.user.findFirst(); // Assuming there's only one user
  if (user) {
    await prisma.todo.create({
      data: { title: request.body.title, user: user.username, date: new Date(request.body.date) },
    });
  }
  response.redirect("/");
});

app.post("/delete", async (request, response) => {
  await prisma.todo.delete({
    where: { id: parseInt(request.body.id) },
  });
  response.redirect("/");
});

app.post('/add-user', async (req, res) => {
  const { username } = req.body;
  try {
    await prisma.user.deleteMany(); // Remove existing users
    const newUser = await prisma.user.create({
      data: {
        username: username,
      },
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating user');
  }
});

app.post('/recall-todos', async (req, res) => {
  const { username } = req.body;
  const user = await prisma.user.findFirst();
  if (user && user.username === username) {
    const todos = await prisma.todo.findMany({
      where: { user: user.username }
    });
    const html = template
      .replace(
        "<!-- todos -->",
        todos
          .map(
            (todo) => `
              <li>
                <span>${escapeHTML(todo.title)}</span>
                <span>(${new Date(todo.date).toLocaleString()})</span>
                <form method="post" action="/update-done" class="update-done-form">
                  <input type="hidden" name="id" value="${todo.id}" />
                  <input type="checkbox" name="done" value="true" ${todo.done ? 'checked' : ''} onclick="this.form.submit()">
                </form>
              </li>
            `,
          )
          .join(""),
      )
      .replace(/<!-- username -->/g, escapeHTML(user.username));
    res.send(html);
  } else {
    res.status(403).send('Unauthorized');
  }
});

app.post('/update-done', async (req, res) => {
  const { id, done } = req.body;
  await prisma.todo.update({
    where: { id: parseInt(id) },
    data: { done: done === 'true' },
  });
  res.redirect('/');
});

app.listen(3000);