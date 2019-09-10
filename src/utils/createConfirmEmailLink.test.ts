import { User } from "./../entity/User";
import * as Redis from "ioredis";
import createConfirmEmailLink from "./createConfirmEmailLink";
import { createTypeormConn } from "./createTypeormConn";
import { getRepository, Repository } from "typeorm";
import fetch from "node-fetch";

let userId = "";
let userRepository: Repository<User>;
const redis = new Redis();
beforeAll(async () => {
  await createTypeormConn();
  userRepository = getRepository(User);
  let user = new User();
  user.email = "register@test.com";
  user.password = "test_password";
  await userRepository.save(user);
  userId = user.id;
});

describe("test createConfirmEmailLink", () => {
  test("Make sure it confirms user and clears key in redis", async () => {
    const url = await createConfirmEmailLink(redis, userId, process.env
      .TEST_HOST as string);
    const response = await fetch(url);
    const text = await response.text();
    expect(text).toBe("ok");
    //confirm the confirmed column is checked in users table
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ["confirmed"]
    });
    //test confirm 后，删除 redis的key pair（id, userId）。
    //Use .toBeTruthy when you don't care what a value is, you just want to ensure a value is true in a boolean context.
    expect((user as User).confirmed).toBeTruthy();
    const chunks = url.split("/");
    const id = chunks[chunks.length - 1];
    const value = await redis.get(id);
    expect(value).toBeNull();
  });
  test("sends invalid back if bad id sent", async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/12345`);
    const text = await response.text();
    expect(text).toBe("invalid");
  });
});
