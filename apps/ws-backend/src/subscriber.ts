import { createClient } from "redis";

const { prisma } = require("@repo/db/prisma");

export const TOPIC = "chat_messages"
const subscriber = createClient();
(async function () {
  await subscriber.connect();
  console.log("Subscriber is active");
})();

async function main() {
  while (true) {
    const data = await subscriber.xRead([{ key: TOPIC, id: "0" }], {
      BLOCK: 0,
    });
    if (data) {
        //@ts-ignore
      for (const messages of data) {
        console.log(`Stream: ${messages.name}`); // channel-name
        for (const response of messages.messages) {
          console.log(`Message ID: ${response.id}`);
          console.log(`Message Data: `, response.message);

          const { roomId, message, userId } = response.message;

          await prisma.chat.create({
            data: {
              roomId:roomId,
              message,
              userId,
            },
          });

          await subscriber.xDel(messages.name, response.id);
        }
      }
    }
  }
}

main();

//* chat_messages func
//* move_messages func
//* delete_messages func