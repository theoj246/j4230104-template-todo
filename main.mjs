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
  const todos = await prisma.todo.findMany();
  const user = await prisma.user.findFirst();
  const html = template
    .replace(
      "<!-- todos -->",
      user
        ? todos
          .filter(todo => todo.user === user.username)
          .map(
            (todo) => `
                <li>
                  <span>${escapeHTML(todo.title)}</span>
                  <form method="post" action="/delete" class="delete-form">
                    <input type="hidden" name="id" value="${todo.id}" />
                    <input type="checkbox" name="delete" value="削除" onclick="this.form.submit()">
                  </form>
                </li>
              `,
          )
          .join("")
        : ""
    )
    .replace("<!-- username -->", user ? escapeHTML(user.username) : "");
  response.send(html);
});

app.post("/create", async (request, response) => {
  await prisma.todo.create({
    data: {
      title: request.body.title,
      user: (await prisma.user.findFirst())?.username || ""
    },
  });
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

app.listen(3000);