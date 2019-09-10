import { User } from "../../entity/User";
// import { createTypeormConn } from "../utils/createTypeormConn";
import { request } from "graphql-request";

import { getRepository, Repository } from "typeorm";
import {
  duplicateEmail,
  invalidEmail,
  emailNotLongEnough,
  passwordNotLongEnough
} from "./errorMessages";
import { createTypeormConn } from "../../utils/createTypeormConn";

const email: string = "abcd@gmail.com";
const password: string = "dcba1234";

const mutation = (e: string, p: string) => `
    mutation {
      register(email: "${e}", password: "${p}") {
        path
        message
      }
    }
  `;
// let typeorm_connection: Connection;
let repository: Repository<User>;
beforeAll(async () => {
  await createTypeormConn();
  repository = getRepository(User);
});

describe("Register user", () => {
  it("register a user", async () => {
    //测试mutation后，返回值是正确的。
    const response = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    //response { register: null }
    expect(response.register).toEqual(null);
    //测试数据库刚被insert的值是否正确。
    // const repository = getRepository(User);
    const users = await repository.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password); //因为hash过了，所以不一样。
  });
  it("duplicate email", async () => {
    //test duplicate email
    const response2 = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  it("bad email", async () => {
    //test invalid email
    const response3 = await request(
      process.env.TEST_HOST as string,
      mutation("x", password)
    );
    expect(response3.register).toEqual([
      {
        path: "email",
        message: emailNotLongEnough
      },
      {
        path: "email",
        message: invalidEmail
      }
    ]);
  });

  it("bad password", async () => {
    //test invalid password
    const response4 = await request(
      process.env.TEST_HOST as string,
      mutation(email, "l")
    );
    expect(response4.register).toHaveLength(1);
    expect(response4.register[0]).toEqual({
      path: "password",
      message: passwordNotLongEnough
    });
  });

  it("bad email and bad password", async () => {
    //test both email and password bad
    const response5 = await request(
      process.env.TEST_HOST as string,
      mutation("x", "l")
    );
    expect(response5.register).toEqual([
      {
        path: "email",
        message: emailNotLongEnough
      },
      {
        path: "email",
        message: invalidEmail
      },
      {
        path: "password",
        message: passwordNotLongEnough
      }
    ]);
  });
});
