import http from "node:http";

let users = [
  { id: 1, name: "Ayush", role: "admin" },
  { id: 2, name: "Rahul", role: "member" }
];

let nextId = 3;

const server = http.createServer((req, res) => {


  if (req.method === "GET" && req.url === "/users") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify(users));
    return;
  }

 
  if (req.method === "GET" && req.url.startsWith("/users/")) {
    const id = Number(req.url.split("/")[2]);

    const user = users.find((user) => user.id === id);

    if (!user) {
      res.writeHead(404);
      res.end("User not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify(user));
    return;
  }

 
  if (req.method === "POST" && req.url === "/users") {

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {

      const data = JSON.parse(body);

      const newUser = {
        id: nextId++,
        name: data.name,
        role: data.role || "member"
      };

      users.push(newUser);

      res.writeHead(201, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify(newUser));
    });

    return;
  }

 
  if (req.method === "DELETE" && req.url.startsWith("/users/")) {

    const id = Number(req.url.split("/")[2]);

    const index = users.findIndex((user) => user.id === id);

    if (index === -1) {
      res.writeHead(404);
      res.end("User not found");
      return;
    }

    users.splice(index, 1);

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      message: "User deleted successfully"
    }));

    return;
  }

 
  res.writeHead(404);
  res.end("Route not found");
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});  