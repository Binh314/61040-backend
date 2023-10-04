import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface EventDoc extends BaseDoc {
  host: ObjectId;
  title: string;
  description: string;
  location: string;
  ageReq: number;
  capacity: number;
  topics: string[];
  amenities: string[];
  accommodations: string[];
  interested: ObjectId[];
  attending: ObjectId[];
}

export default class EventConcept {
  public readonly events = new DocCollection<EventDoc>("events");

  async create(host: ObjectId, title: string, description: string, location: string, ageReq: number, capacity: number) {
    const _id = await this.events.createOne({ host, title, description, location, ageReq, capacity, topics: [], amenities: [], accommodations: [], interested: [], attending: [] });
    return { msg: "Event successfully created!", event: await this.events.readOne({ _id }) };
  }

  async getEvents(query: Filter<EventDoc>) {
    const events = await this.events.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return events;
  }

  async getByHost(host: ObjectId) {
    return await this.getEvents({ host });
  }

  async update(_id: ObjectId, update: Partial<EventDoc>) {
    this.sanitizeUpdate(update);
    await this.events.updateOne({ _id }, update);
    return { msg: "Event successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.events.deleteOne({ _id });
    return { msg: "Event deleted successfully!" };
  }

  async isHost(host: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.host.toString() !== host.toString()) {
      throw new EventHostNotMatchError(host, _id);
    }
  }

  async isNotHost(host: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.host.toString() === host.toString()) {
      throw new NotAllowedError("Person is a host.");
    }
  }

  async isInterested(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.interested.filter((id: ObjectId) => id.toString() == person.toString()).length == 0) {
      throw new NotFoundError(`Person not interested in event.`);
    }
  }
  async isNotInterested(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.interested.filter((id: ObjectId) => id.toString() == person.toString()).length > 0) {
      throw new NotFoundError(`Person already interested in event.`);
    }
  }

  async isAttending(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.attending.filter((id: ObjectId) => id.toString() == person.toString()).length == 0) {
      throw new NotFoundError(`Person not attending event.`);
    }
  }

  async isNotAttending(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.attending.filter((id: ObjectId) => id.toString() == person.toString()).length > 1) {
      throw new NotFoundError(`Person is already attending event.`);
    }
  }

  async indicateInterest(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const interested = event.interested;
    const attending = event.attending;

    interested.push(person);

    const personStrings = attending.map((id: ObjectId) => id.toString());
    const attend_idx = personStrings.indexOf(person.toString());
    if (attend_idx !== -1) attending.splice(attend_idx, 1);

    this.events.updateOne({ _id }, { interested: interested, attending: attending });
    return { msg: "Successfully indicated interest in event." };
  }

  async removeInterest(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const interested = event.interested;
    const attending = event.attending;

    const personStrings = interested.map((id: ObjectId) => id.toString());
    const interest_idx = personStrings.indexOf(person.toString());
    interested.splice(interest_idx, 1);

    const attend_idx = attending.indexOf(person);
    if (attend_idx !== -1) attending.splice(attend_idx, 1);

    this.events.updateOne({ _id }, { interested: interested, attending: attending });
    return { msg: "Successfully removed interest in event." };
  }

  async indicateAttendance(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const interested = event.interested;
    const attending = event.attending;

    attending.push(person);

    const personStrings = interested.map((id: ObjectId) => id.toString());
    const interest_idx = personStrings.indexOf(person.toString());
    if (interest_idx !== -1) interested.splice(interest_idx, 1);

    this.events.updateOne({ _id }, { interested: interested, attending: attending });
    return { msg: "Successfully indicated attendance for event." };
  }

  async removeAttendance(person: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const interested = event.interested;
    const attending = event.attending;

    const attend_idx = attending.indexOf(person);
    attending.push(person);

    const personStrings = attending.map((id: ObjectId) => id.toString());
    const interest_idx = personStrings.indexOf(person.toString());
    if (interest_idx !== -1) interested.splice(interest_idx, 1);

    this.events.updateOne({ _id }, { interested: interested, attending: attending });
    return { msg: "Successfully removed attendance for event." };
  }

  async addTopic(_id: ObjectId, topic: string) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const topics = event.topics;
    if (topics.includes(topic)) throw new NotAllowedError(`Topic already exists.`);

    topics.push(topic);

    this.events.updateOne({ _id }, { topics: topics });
    return { msg: "Successfully added topic to event." };
  }

  async removeTopic(_id: ObjectId, topic: string) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const topics = event.topics;
    if (!topics.includes(topic)) throw new NotAllowedError(`Topic does not exist.`);

    const topic_idx = topics.indexOf(topic);
    topics.splice(topic_idx, 1);

    this.events.updateOne({ _id }, { topics: topics });
    return { msg: "Successfully removed topic from event." };
  }

  async addAmenity(_id: ObjectId, amenity: string) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const amenities = event.amenities;
    if (amenities.includes(amenity)) throw new NotAllowedError(`Amenity already exists.`);

    amenities.push(amenity);

    this.events.updateOne({ _id }, { amenities: amenities });
    return { msg: "Successfully added amenity to event." };
  }

  async removeAmenity(_id: ObjectId, amenity: string) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const amenities = event.amenities;
    if (!amenities.includes(amenity)) throw new NotAllowedError(`Amenity does not exist.`);

    const amenity_idx = amenities.indexOf(amenity);
    amenities.splice(amenity_idx, 1);

    this.events.updateOne({ _id }, { amenities: amenities });
    return { msg: "Successfully removed amenity from event." };
  }

  async addAccommodation(_id: ObjectId, accommodation: string) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const accommodations = event.accommodations;
    if (accommodations.includes(accommodation)) throw new NotAllowedError(`Accommodation already exists.`);

    accommodations.push(accommodation);

    this.events.updateOne({ _id }, { accommodations: accommodations });
    return { msg: "Successfully added accommodation to event." };
  }

  async removeAccommodation(_id: ObjectId, accommodation: string) {
    const event = await this.events.readOne({ _id });
    if (!event) throw new NotFoundError(`Event does not exist.`);

    const accommodations = event.accommodations;
    if (!accommodations.includes(accommodation)) throw new NotAllowedError(`Accommodation does not exist.`);

    const accommodation_idx = accommodations.indexOf(accommodation);
    accommodations.splice(accommodation_idx, 1);

    this.events.updateOne({ _id }, { accommodations: accommodations });
    return { msg: "Successfully removed accommodation from event." };
  }

  private sanitizeUpdate(update: Partial<EventDoc>) {
    // Make sure the update cannot change the host, interested people, or attendees
    const prohibitedUpdates = ["host"];
    for (const key in update) {
      if (prohibitedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class EventHostNotMatchError extends NotAllowedError {
  constructor(
    public readonly host: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the host of Event {1}!", host, _id);
  }
}
