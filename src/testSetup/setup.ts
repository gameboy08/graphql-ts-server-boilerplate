import { startServer } from "../startServer";
import { AddressInfo } from "net";
async function setup() {
  //start the server, get typeorm connection (typeorm connecting to database)

  const { app } = await startServer();
  const { port } = app.address() as AddressInfo;

  process.env.TEST_HOST = `http://127.0.0.1:${port}`;
  return null;
}

export default setup;
