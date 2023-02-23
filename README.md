<h1 align="center" style="margin-bottom: 0" >bootpress</h1>
<p align=center>Express but SpringBoot like</p>

## Methods
### **RestService**: Converts all methods to Express RequestHandlers
#### Basic usage:
```ts
const UserServiceImpl = {
    users: [1, 2, 3, 4],
    findAllUsers(): number[] {
        return this.users;
    },
    findUserById(id: number) {
        return this.users.find(user => user == id);
    }
};

const UserService = RestService(UserServiceImpl);

app.get("/users", UserService.findAllUsers);
app.get("/users/:id", (req) => UserService.findUserById(+req.params.id));
```

#### Advanced usage:
```ts
class PostServiceImpl {
    posts = [1, 2, 3, 4, 5];
    findById(id: number | string) {
        return getOrThrow(
            this.posts.find(p => p == id),
            new HttpError(404, "Post is not found")
        );
    }
    add(id: number) {
        this.posts.push(id);
        return new HttpResponse(201, id);
    }
    delete(id: number) {
        const idx = this.posts.indexOf(id);
        if (idx > -1) {
            this.posts.splice(idx, 1);
            this.#printDeleted(id);
        }
    }
    // use private methods to  
    #printDeleted(id: number | string) {
        console.warn(`post ${id} is deleted`)
    }
}

const PostService = RestService(new PostServiceImpl());

app.get("/posts/:id", (req) => PostService.findById(req.params.id));
app.post("/posts/:id", (req) => PostService.add(+req.params.id));
```

### **RestMethod**: Converts single method to RequestHandler
#### Usage:
```ts
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

### **Restify**: Decorator to convert a single method to RequestHandler
#### Note that currently decorators in Typescript doesn't support changing the return type of applied method. So you have to provide RequestHandler as an "or type":

```ts
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