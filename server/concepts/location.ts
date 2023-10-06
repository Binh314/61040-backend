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

  /**
   * Source: https://henry-rossiter.medium.com/calculating-distance-between-geographic-coordinates-with-javascript-5f3097b61898
   */
  private cosineDistanceBetweenPoints(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const deltaP = p2 - p1;
    const deltaLon = lon2 - lon1;
    const deltaLambda = (deltaLon * Math.PI) / 180;
    const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
    return d;
  }
}
