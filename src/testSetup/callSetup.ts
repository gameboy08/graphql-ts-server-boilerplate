import setup from "./setup";

export default async function callSetup() {
  if (!process.env.TEST_HOST) {
    await setup();
  }
  return null;
}
