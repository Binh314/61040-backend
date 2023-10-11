import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface MessageDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  text: string;
  files: string[];
}

export default class MessageConcept {
  public readonly messages = new DocCollection<MessageDoc>("messages");

  async send(from: ObjectId, to: ObjectId, text: string, files?: string[]) {
    const _id = await this.messages.createOne({ from, to, text, files: files ? files : [] });
    return { msg: "Message successfully created", message: await this.messages.readOne({ _id }) };
  }

  async getMessages(query: Filter<MessageDoc>) {
    const messages = await this.messages.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return messages;
  }

  async getConversation(person1: ObjectId, person2: ObjectId) {
    const fromToQuery = { from: person1, to: person2 };
    const toFromQuery = { to: person1, from: person2 };
    const query = { $or: [fromToQuery, toFromQuery] };
    return await this.getMessages(query);
  }
}
