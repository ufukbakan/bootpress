import type { Request, Response } from "express";
import { it } from "vitest";
import { Route } from ".";
import { HttpResponse } from "./helpers";

// @ts-ignore
const mockReq = {
  params: {
    id: "1"
  },
  body: {
    name: "John Doe"
  }
} as Request;
const mockRes = {
  // @ts-ignore
  status: (...args: any[]) => console.log({ status: args }) || mockRes,
  // @ts-ignore
  json: (...args: any[]) => console.log("json", args) || mockRes,
  // @ts-ignore
  send: (...args: any[]) => console.log("send", args) || mockRes,
  // @ts-ignore
  contentType: (...args: any[]) => console.log("contentType", args) || mockRes,
} as Response;

it("test Route", () => {
  function getUser(id: string, body: { name: string }) {
    return {
      id,
      name: body.name
    }
  }
  Route().param("id").body({ name: "string" }).to(getUser)(mockReq, mockRes)
});

it("test Route no params", () => {
  function getUser() {
    return {
      id: "1",
      name: "John Doe"
    }
  }
  Route().to(getUser)(mockReq, mockRes);
});

it("Rest method with no args", () => {
  function getUser() {
    return { id: "1", name: "John Doe" }
  }

  const endpoint = Route().to(getUser);
  endpoint(mockReq, mockRes);
})

it("Rest method with args", () => {
  function getUser(id: number) {
    return {
      1: "John Doe",
      2: "Jane Doe"
    }[id];
  }

  const endpoint = Route().param("id").to(getUser);
  endpoint(mockReq, mockRes);
})

it("Html Response", () => {
  const helloWorld = () => new HttpResponse({
    data: "<h1>Hello World</h1>",
    type: "text/html"
  });
  const endpoint = Route().to(helloWorld);
  endpoint(mockReq, mockRes);
});