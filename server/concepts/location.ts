import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface LocationDoc extends BaseDoc {
  poi: ObjectId;
  address: string;
  location: JSON;
}

export default class LocationConcept {
  public readonly posts = new DocCollection<LocationDoc>("locations");

  async getAddressLocation(address: string) {
    // Using Google API
    const myAPIKey = process.env.GOOGLE_API_KEY;
    const geocodingUrl: string = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${myAPIKey}`;

    const response = await fetch(geocodingUrl);
    const results = await response.json();
    if (results.results.length === 0) {
      throw new NotFoundError("Address Not Found");
    }
    const location = results.results[0].geometry.location;
    return location;
  }
}
