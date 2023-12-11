<h1 align="center" style="margin-bottom: 0" >
<img src="https://raw.githubusercontent.com/ufukbakan/bootpress/main/bootpress.svg" width=500 alt="bootpress">
</h1>
<p align=center>Express but Spring Boot like</p>
<center>

[![npm](https://img.shields.io/npm/v/bootpress)](https://www.npmjs.com/package/bootpress)
![npm downloads](https://img.shields.io/npm/dt/bootpress)
![MIT license](https://img.shields.io/npm/l/bootpress)

</center>

## Quick Start
Recommended tool: **[create-bootpress-app](https://www.npmjs.com/package/create-bootpress-app)**
___

## Methods
### **<u>RestService</u>**: Converts all methods to Express RequestHandlers.
Http Response Status will inherit status field of returned value by method or 200 by default.

Http Response Body will be mapped to 'data' field or value itself by default.

If you want to explicitly specify a field named 'data' or 'status' it's recommended to encapsulate your value with HttpResponse class.
#### Basic usage:
```ts
import express from "express";
import { HttpError, PassParam, RestService } from "bootpress";
import { as, getOrThrow } from "bootpress/helpers";

const app = express();
app.use(express.json());

const UserServiceImpl = {
    users: [1, 2, 3, 4],
    findAllUsers(): number[] {
        return this.users;
    },
    findUserById(idInParams: string | undefined) {
        const id = as(idInParams, "integer");
        return getOrThrow(this.users.find(user => user === id), new HttpError(404, "Not Found"));
    }
};

const UserService = RestService(UserServiceImpl);

app.get("/users", UserService.findAllUsers());
app.get("/users/:id", PassParam("id")(UserService.findUserById));
```

#### Advanced usage:
```ts
import { HttpError, HttpResponse, PassBody, PassParam, PassQuery, RestService } from "bootpress";
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
    delete(deleteInQuery: string | undefined, idInQuery: string | undefined) {
        if (deleteInQuery === "yes") {
            const id = as(idInQuery, "integer");
            const index = this.posts.indexOf(id);
            if (index > -1) {
                this.#logDeleted(idInQuery!);
                return this.posts.splice(index, 1);
            } else {
                throw new HttpError(404, "Post is not found")
            }
        }
        throw new HttpError(400, "Bad Request");
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
app.delete("/posts", PassQuery("delete")(PassQuery("id")(PostService.delete)));
app.get("/posts/:id", PassParam("id")(PostService.findById));
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

### **Argument Passers**

```PassBody(serviceFunction)``` -> Passes body to service function without any validation

```ParseBodyAs(type, config?)(serviceFunction)``` -> Parses body to specified type then passes it to service function. Config object is optional and has messageTemplate field which represents a string with details placeholder: ```{0}```

```PassBodyAs(type, config?)(serviceFunction)``` -> Validates body with provided type and passes it to service function. Config object is optional and has messageTemplate field which represents a string with details placeholder: ```{0}```

```PassAllParams(serviceFunction)``` -> Passes all path parameters to service function as a Record<string, string> (pure js object that contains key-value pairs)

```PassAllQueries(serviceFunction)``` -> Passes query to service function as Record<string, string>

```PassAllCookies(serviceFunction)``` -> Passes cookies to service function as Record<string, string>

```PassParam(pathParam)(serviceFunction)``` -> Passes specified parameter as arguments to service function

```PassQuery(searchQueryName)(serviceFunction)``` -> Passes specified query as arguments to service function

```PassCookie(cookieName)(serviceFunction)``` -> Passes specified cookie as arguments to service function

```PassRequest(serviceFunction)``` -> Passes express request object to service function

```PassResponse(serviceFunction)``` -> Passes express response object to service function

### Chaining argument passers:
Argument passers can be chained by passing result of one as serviceFunction parameter to other. e.g.:
```ts
// in rest service class:
function serviceFunction(cookies, body){
    ...
}
// in router:
router.post("/", PassAllCookies( PassBodyAs(yourSchema)(restService.serviceFunction) ));
```


## Helper Methods

### **getOrThrow(value, httpError)**
Returns the value back if it's not null, undefined or empty array.
### **getOrElse(value, defaultValue)**
Returns the value if it's not null or undefined otherwise returns the default value.
### **schema(object)**
Helps you to define a JS Schema.
### **as(target: any, [type: string | object | array](#type-paramter-for-as--asstrict-methods), [config? object](#config-object-optional-for-as--asstrict-methods))**
Tries to parse target value to provided type.
#### Type paramter (for as & asStrict methods)
If type of provided type is string then it's a primitive key and valid values are:
```ts
"string"
"string[]"
"boolean"
"boolean[]"
"number"
"number[]"
"integer"
"integer[]"
"string?"
"string[]?"
"boolean?"
"boolean[]?"
"number?"
"number[]?"
"integer?"
"integer[]?"
```
If typeof provided type is object then it's a JS Schema and structure must follow:
```ts
{
    "property": string | object | Array // Nullable primitives not allowed here instead use question mark end of the property key
    "nullableProperty?": string | object | Array
}
```

If typeof provided type is an array the structure must follow: 
```ts
[
    yourJsSchemaObject
]
```
There must be only one element in an array schema which defines ````ArrayOf<Schema>````
#### Config object (optional for as & asStrict methods)
Config object is optional and structure follows:
```ts
{
    errorVariableName: string | undefined, // variable name in the error message
    messageTemplate: string | undefined // default values is "{0}" where it directly writes error details.
    // an messageTemplate example is: "Parse error:\n{0}"
}
```
### **asStrict(target: any, [type: string | object | array](#type-parameter), [config? object](#config-object-optional-for-as--asstrict-methods))**
Same as 'as' method but doesn't try to parse different types instead throws error.

# Release Notes

## v10.0.0:
- Configuration support for as, asStrict, passBodyAs and parseBodyAs methods.
- Integrated logger. (Changeable via setLogger method)
- 500 server errors are logged with error level.

## v9.1.0:
- Fixed chained argument type error bugs
- Improvements in argument passer type declarations

## v9.0.2:
- Added support for null/undefined returning async functions

## v9.0.1:
- Fixed errors in argument passers

## v9.0.0:
- New Feature:
  - Type checking for each argument while passing arguments to service methods
- Deprecated:
  - PassQueries, PassCookies, PassParams
  - Please use PassAllQueries, PassAllCookies or PassAllParams
- Added:
  - PassQuery, PassCookie, PassParam

## v8.0.0:
- Added support for async service functions. (You don't need to await if you wrapped your service with Bootpress functions)
- Bugfix for falsy response values
- Simplified implementation

## v7.1.0:
- getOrThrow: Throws specified error when value is an empty array too.
## v7.0.0:

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