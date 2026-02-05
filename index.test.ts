import { Request, Response } from "express";
import { it } from "vitest";
import { Needs, RestMethod } from ".";

it("test needs", () => {
    function getUser(id: string, body: { name: string }) {
        return {
            id,
            name: body.name
        }
    }

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

    // console.log(
    //     RestMethod(getUser).toString()
    // );

    // console.log(
    //     Needs().param("id").body({ name: "string" }).to(RestMethod(getUser)).toString()
    // );

    Needs().param("id").body({ name: "string" }).to(getUser)(mockReq, mockRes)
    // console.log();
});