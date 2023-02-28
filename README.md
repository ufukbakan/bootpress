<h1 align="center" style="margin-bottom: 0" >
<img src="bootpress.svg" height=120 alt="bootpress">
</h1>
<p align=center>Express but Spring Boot like</p>

## Methods
### **<u>RestService</u>**: Converts all methods to Express RequestHandlers
#### Basic usage:
```ts
import express from "express";
import { HttpError, PassParams, RestService } from "bootpress";
import { asInteger, getOrThrow } from "bootpress/helpers";

const app = express();
app.use(express.json());

const UserServiceImpl = {
    users: [1, 2, 3, 4],
    findAllUsers(): number[] {
        return this.users;
    },
    findUserById(idInParams: string) {
        const id = asInteger(idInParams);
        return getOrThrow(this.users.find(user => user == id), new HttpError(404, "Not Found"));
    }
};

const UserService = RestService(UserServiceImpl);

app.get("/users", UserService.findAllUsers());
app.get("/users/:id", PassParams("id")(UserService.findUserById));
```

#### Advanced usage:
```ts
import { HttpError, HttpResponse, PassBody, PassParams, PassQueries, RestService } from "bootpress";
import { asInteger, asSchema, getOrThrow } from "bootpress/helpers";

class PostServiceImpl {
    posts = [1, 2, 3, 4, 5];
    findById(id: number | string) {
        console.log("looking for " + id);
        return getOrThrow(
            this.posts.find(p => p == id),
            new HttpError(404, "Post is not found")
        );
    }
    add(body: any) {
        let casted = asSchema(body, {
            "id": "number"
        });
        this.posts.push(casted.id);
        return new HttpResponse(201, casted.id);
    }
    delete(deleteInQuery: string, idInQuery: string) {
        const idx = deleteInQuery === "yes" ? this.posts.indexOf(asInteger(idInQuery)) : -1;
        if (idx > -1) {
            this.posts.splice(idx, 1);
            this.#printDeleted(idInQuery);
        }
    }
    // use private methods to  
    #printDeleted(id: number | string) {
        console.warn(`post ${id} is deleted`)
    }
    findAll() {
        return this.posts;
    }
}

const PostService = RestService(PostServiceImpl);
// this is valid too:
// const PostService = RestService(new PostServiceImpl());

app.get("/posts", PostService.findAll())
app.post("/posts", PassBody(PostService.add));
app.delete("/posts", PassQueries("delete", "id")(PostService.delete));
app.get("/posts/:id", PassParams("id")(PostService.findById));
```

### **<u>RestMethod</u>**: Converts single method to RequestHandler
#### Usage:
```ts
import { HttpError, RestMethod } from "bootpress";
import { getOrThrow } from "bootpress/helpers";

class UserService {
    users = [1, 2, 3, 4];
    findAll()  {
        return RestMethod(() => {
            return this.users;
        })
    }
    findById(id: number) {
        return RestMethod(() => {
            return getOrThrow(this.users.find(u => u == id), new HttpError(404, "Not Found"));
        })
    }
}

const userService = new UserService();

app.get("/users", userService.findAll())
app.get("/users/:id", (req) => userService.findById(+req.params.id))
```

### **<u>Restify</u>**: Decorator to convert a single method to RequestHandler
#### Note that currently decorators in Typescript doesn't support changing the return type of applied method. So you have to provide RequestHandler as an "or type":

```ts
import { Restify } from "bootpress";
import { RequestHandler } from "express";

class LogServiceImpl {
    logs = ["log1", "log2", "log3"];

    @Restify
    findAll(): string[] | RequestHandler {
        return this.logs;
    }
}

const LogService = new LogServiceImpl();

app.get("/logs", LogService.findAll() as RequestHandler)
```