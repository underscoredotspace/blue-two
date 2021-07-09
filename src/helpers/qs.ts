import querystring from "querystring";

export const qs = (obj?: querystring.ParsedUrlQueryInput): string =>
    querystring.stringify(
        Object.entries(obj ?? {})
            .filter(([_, val]) => ![undefined, null, ""].includes(val as any))
            .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {}),
    );
