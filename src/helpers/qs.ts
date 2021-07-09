import querystring from "querystring";

export const qs = (obj?: querystring.ParsedUrlQueryInput): string =>
    querystring.stringify(
        Object.entries(obj ?? {})
            .filter(([_, val]) => val !== undefined)
            .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {}),
    );
