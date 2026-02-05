import { Request, Response } from "express";
import { it } from "vitest";
import { Needs, RestMethod } from ".";

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
} as Response;

it("test needs", () => {
    function getUser(id: string, body: { name: string }) {
        return {
            id,
            name: body.name
        }
    }
    Needs().param("id").body({ name: "string" }).to(getUser)(mockReq, mockRes)
});

it("Rest method with no args", () => {
    function getUser() {
        return { id: "1", name: "John Doe" }
    }

    const endpoint = RestMethod(getUser);
    console.log(endpoint(mockReq, mockRes));
})

it("Rest method with args", () => {
    function getUser(id: number) {
        return {
            1: "John Doe",
            2: "Jane Doe"
        }[id];
    }

    const endpoint = RestMethod(getUser);
    console.log(endpoint(1)(mockReq, mockRes));
})
