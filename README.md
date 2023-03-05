<h1 align="center" style="margin-bottom: 0" >
<img src="https://raw.githubusercontent.com/ufukbakan/bootpress/main/bootpress.svg" height=120 alt="bootpress">
</h1>
<p align=center>Express but Spring Boot like</p>

## Quick Start
Recommended tool: [create-bootpress-app](https://www.npmjs.com/package/create-bootpress-app)

## Methods
### **<u>RestService</u>**: Converts all methods to Express RequestHandlers
#### Basic usage:
```ts
import express from "express";
import { HttpError, PassParams, RestService } from "bootpress";
import { as, getOrThrow } from "bootpress/helpers";

const app = express();
app.use(express.json());

const UserServiceImpl = {
    users: [1, 2, 3, 4],
    findAllUsers(): number[] {
        return this.users;
    },
    findUserById(idInParams: string) {
        const id = as(idInParams, "integer");
        return getOrThrow(this.users.find(user => user === id), new HttpError(404, "Not Found"));
    }
};

const UserService = RestService(UserServiceImpl);

app.get("/users", UserService.findAllUsers());
app.get("/users/:id", PassParams("id")(UserService.findUserById));
```

#### Advanced usage:
```ts
import { HttpError, HttpResponse, PassBody, PassParams, PassQueries, RestService } from "bootpress";
import { as, asStrict, getOrThrow } from "bootpress/helpers";

class PostServiceImpl {
    posts = [1, 2, 3, 4, 5];
    findById(id: string) {
        return getOrThrow(
            this.posts.find(p => p === as(id, "integer")),
            new HttpError(404, "Post is not found")
        );
    }
    add(body: any) {
        let casted = asStrict(body, {
            "id": "number"
        });
        this.posts.push(casted.id);
        return new HttpResponse(201, casted.id);
    }
    delete(deleteInQuery: string, idInQuery: string) {
        const idx = deleteInQuery === "yes" ? this.posts.indexOf(as(idInQuery, "integer")) : -1;
        if (idx > -1) {
            this.#logDeleted(idInQuery);
            return this.posts.splice(idx, 1);
        }else {
            throw new HttpError(404, "Post is not found")
        }
    }
    // use private methods to  
    #logDeleted(id: number | string) {
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
## v7.1.0 Release Notes:
- getOrThrow: Throws specified error when value is an empty array too.
## v7.0.0 Release Notes:

### Deprecated helper methods:
- asSchema
- asString
- asBoolean
- asInteger
- asNumber

Please use "as" or "asStrict" instead of these functions. For example:

```ts
//const x: string = asString(o); // deprecated
const x: string = as(o, "string"); 
```

### Added / Changed helper methods:
- asStrict : Asserts types strictly
- PassBodyAs(schema): Body must be as same as schema
- ParseBodyAs(schema): Body have to be parsable to schema