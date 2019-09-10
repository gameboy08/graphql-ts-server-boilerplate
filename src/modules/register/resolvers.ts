import { User } from "../../entity/User";
import { ResolverMap } from "../../types/graphql-utils";
import * as bcrypt from "bcryptjs";
import { getConnection, Repository } from "typeorm";
import * as yup from "yup";
import formatYupError from "../../utils/formatYupError";
import {
  duplicateEmail,
  invalidEmail,
  emailNotLongEnough,
  passwordNotLongEnough
} from "./errorMessages";
import createConfirmEmailLink from "../../utils/createConfirmEmailLink";

let repository: Repository<User>;
const initialize = () => {
  const connection = getConnection();
  repository = connection.getRepository(User);
};

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailNotLongEnough)
    .max(255)
    .email(invalidEmail),
  password: yup
    .string()
    .min(3, passwordNotLongEnough)
    .max(255)
});

export const resolvers: ResolverMap = {
  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments,
      { redis, url }
    ) => {
      try {
        await schema.validate(args, {
          abortEarly: false
        });
      } catch (error) {
        // console.log("error", error);
        return formatYupError(error);
      }
      const { email, password } = args;

      if (repository === undefined) {
        initialize();
      }
      const userAlreadyExists = await repository.findOne({
        where: { email },
        select: ["id"]
      });
      if (userAlreadyExists) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ];
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let user = new User();
      user.email = email;
      user.password = hashedPassword;
      await repository.save(user);
      await createConfirmEmailLink(redis, user.id, url);
      return null;
    }
  }
};
