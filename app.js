const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User, Notes },
} = require("./db");
const path = require("path");

//Internal if we refractor code to call byToken easily
// const requireToken (req, res, next) => {
//   try {
//     const token = req.headers.authorization;
//     const user = await User.byToken(token);
//     req.user = user;
//     next();
//   } catch(error) {
//     next(error);
//   }
// }

// How to refractor
// app.get('/home', requireToken, (req, res, next) => {
//   res.send('Home page!');
// });

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    console.log("this is header", req.headers);
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/notes", async (req, res, next) => {
  try {
    const checkUser = await User.byToken(req.headers.authorization);
    if (checkUser.id === req.params.id) {
      const response = await User.findByPk(req.params.id, { include: [Notes] });
      res.send(response.notes);
    }
  } catch (ex) {
    console.log("your get notes route -err");
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
