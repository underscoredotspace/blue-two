module.exports = {
    moduleNameMapper: {
        "~/(.*)": "<rootDir>/$1",
    },
    preset: "ts-jest",
    testEnvironment: "node",
    rootDir: "src",
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.ts",
        "!**/{constants,types,index}.ts",
        "!helpers/env.ts",
        "!db/entities/*.ts",
    ],
    coverageThreshold: {
        global: {
            branches: 95,
            functions: 95,
        },
    },
};
