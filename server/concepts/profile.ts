import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  person: ObjectId;
  name: string;
  bio: string;
  location: string;
  interests: string[];
  birthdate: Date;
  posts: ObjectId[];
}

export default class EventConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");
  async create(person: ObjectId) {
    const _id = await this.profiles.createOne({ person, name: "", bio: "", location: "", interests: [], posts: [] });
    return { msg: "Profile successfully created!", id: _id, profile: await this.profiles.readOne({ _id }) };
  }
  async getProfiles(query: Filter<ProfileDoc>) {
    const profiles = await this.profiles.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return profiles;
  }
  async getProfile(person: ObjectId) {
    return await this.profiles.readOne({ person });
  }
  async update(person: ObjectId, update: Partial<ProfileDoc>) {
    this.sanitizeUpdate(update);
    await this.profiles.updateOne({ person }, update);
    return { msg: "Profile successfully updated!" };
  }
  async delete(person: ObjectId) {
    await this.profiles.deleteOne({ person });
    return { msg: "Profile deleted successfully!" };
  }
  async isPersonsProfile(person: ObjectId, _id: ObjectId) {
    const profile = await this.profiles.readOne({ _id });
    if (!profile) {
      throw new NotFoundError(`Profile ${_id} does not exist!`);
    }
    if (profile.person.toString() !== person.toString()) {
      throw new ProfilePersonNotMatchError(person, _id);
    }
  }

  async addInterest(person: ObjectId, interest: string) {
    const profile = await this.profiles.readOne({ person });
    if (!profile) throw new NotFoundError(`Profile does not exist.`);
    const interests = profile.interests;
    if (interests.includes(interest)) throw new NotAllowedError(`Interest already exists.`);
    interests.push(interest);
    this.profiles.updateOne({ person }, { interests });
    return { msg: "Successfully added interest to profile." };
  }
  async removeInterest(person: ObjectId, interest: string) {
    const profile = await this.profiles.readOne({ person });
    if (!profile) throw new NotFoundError(`Profile does not exist.`);
    const interests = profile.interests;
    if (!interests.includes(interest)) throw new NotAllowedError(`Interest does not exists.`);
    const interest_idx = interests.indexOf(interest);
    interests.splice(interest_idx, 1);
    this.profiles.updateOne({ person }, { interests });
    return { msg: "Successfully added interest to profile." };
  }

  private sanitizeUpdate(update: Partial<ProfileDoc>) {
    // Make sure the update cannot change the host, interested people, or attendees
    const prohibitedUpdates = ["person"];
    for (const key in update) {
      if (prohibitedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class ProfilePersonNotMatchError extends NotAllowedError {
  constructor(
    public readonly person: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the person of Profile {1}!", person, _id);
  }
}
