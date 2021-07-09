import { qs } from "./qs";

describe("Creating url querystrings from an object", () => {
    test("should return valid querystring", () => {
        const result = qs({ a: 1, b: "something", c: ["z", "x", "y"] });
        expect(result).toEqual("a=1&b=something&c=z&c=x&c=y");
    });

    test("should strip out empty string, null & undefined but not not other falsy", () => {
        const result = qs({ a: null, b: undefined, c: false, d: 0, e: "" });
        expect(result).toEqual("c=false&d=0");
    });

    test("should return empty string if object is undefined", () => {
        const obj = undefined;
        const result = qs(obj);
        expect(result).toEqual("");
    });
});
