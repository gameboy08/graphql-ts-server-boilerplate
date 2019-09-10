import { Redis } from "ioredis";
import { v4 } from "uuid";
export default async function createConfirmEmailLink(
  redis: Redis,
  user_id: string,
  url: string
) {
  let id = v4();
  await redis.set(id, user_id, "ex", 60 * 60 * 24);
  return `${url}/confirm/${id}`;
}
