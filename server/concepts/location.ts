import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface LocationDoc extends BaseDoc {
  poi: ObjectId;
  type: string;
  address: string;
  location: {
    lat: number;
    lon: number;
  };
}

export default class LocationConcept {
  public readonly locations = new DocCollection<LocationDoc>("locations");

  async hasLocation(poi: ObjectId) {
    const location = await this.locations.readOne({ poi });
    if (!location) throw new NotAllowedError("POI does not have a location.");
  }

  async hasNoLocation(poi: ObjectId) {
    const location = await this.locations.readOne({ poi });
    if (location) throw new NotAllowedError("POI already has a location.");
  }

  async create(poi: ObjectId, type: string, lat: number, lon: number, address: string = "") {
    const existingLocation = await this.locations.readOne({ poi });
    const location = { lat, lon };
    if (existingLocation) return this.locations.updateOne({ poi }, { type, location, address });
    const _id = await this.locations.createOne({ poi, type, location, address });
    return { msg: "Post successfully created!", location: await this.locations.readOne({ _id }) };
  }

  async delete(poi: ObjectId) {
    await this.locations.deleteOne({ poi });
    return { msg: "Location deleted successfully!" };
  }

  async update(poi: ObjectId, update: Partial<LocationDoc>) {
    this.sanitizeUpdate(update);
    await this.locations.updateOne({ poi }, update);
    return { msg: "Location successfully updated!", location: await this.locations.readOne({ poi }) };
  }

  async get(poi: ObjectId) {
    const location = await this.locations.readOne({ poi });
    if (!location) throw new NotFoundError("Location for POI Not Found");
    return { lat: location.location.lat, lon: location.location.lon };
  }

  async getLocations(query: Filter<LocationDoc>) {
    const locations = await this.locations.readMany(query);
    return locations;
  }

  async getNearby(poi: ObjectId, type: string, radius: number) {
    const location = await this.get(poi);
    const locations = await this.getLocations({ type });
    const nearbyLocations = locations.filter((loc: LocationDoc) => {
      return this.cosineDistanceBetweenPoints(location, loc.location) <= radius * 1000;
    });
    return nearbyLocations;
  }

  async getAtLocation(poi: ObjectId, type: string) {
    const marginOfError = 0.25; // km
    return this.getNearby(poi, type, marginOfError);
  }

  async getDistance(from: ObjectId, to: ObjectId) {
    const fromLocation = await this.get(from);
    const toLocation = await this.get(to);
    return this.cosineDistanceBetweenPoints(fromLocation, toLocation);
  }

  async getDistances(from: ObjectId, tos: ObjectId[]) {
    const fromLocation = await this.get(from);
    const toLocations = await this.locations.readMany({ poi: { $in: tos } });
    const distanceMap: Map<string, number> = new Map(); // key is object id string
    for (const location of toLocations) {
      const dist = this.cosineDistanceBetweenPoints(fromLocation, location.location);
      const poi = location.poi.toString();
      distanceMap.set(poi, dist);
    }
    return distanceMap;
  }

  async getFromAddress(address: string) {
    // Using Google API
    const myAPIKey = process.env.GOOGLE_API_KEY;
    const geocodingUrl: string = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${myAPIKey}`;

    const response = await fetch(geocodingUrl);
    const results = await response.json();
    if (results.results.length === 0) {
      throw new NotFoundError("Location Not Found");
    }
    const location = results.results[0].geometry.location;
    return { lat: location.lat, lon: location.lng };
  }

  private sanitizeUpdate(update: Partial<LocationDoc>) {
    // Make sure the update cannot change the host, interested people, or attendees
    const prohibitedUpdates = ["poi"];
    for (const key in update) {
      if (prohibitedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }

  /**
   * Source: https://henry-rossiter.medium.com/calculating-distance-between-geographic-coordinates-with-javascript-5f3097b61898
   */
  private cosineDistanceBetweenPoints(fromLocation: { lat: number; lon: number }, toLocation: { lat: number; lon: number }) {
    const lat1 = fromLocation.lat;
    const lon1 = fromLocation.lon;
    const lat2 = toLocation.lat;
    const lon2 = toLocation.lon;
    const R = 6371e3; // meters
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
