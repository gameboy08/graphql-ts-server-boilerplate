module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "./src/testSetup/callSetup.ts"
};
