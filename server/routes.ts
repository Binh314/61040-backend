import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Event, Friend, Location, Message, Post, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
// import {EventDoc} from "./concepts/event";
import Responses from "./responses";

class Routes {
  // User Session

  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  // Post

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  // Friend

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // Event

  @Router.get("/events")
  async getEvents(host?: string) {
    let events;
    if (host) {
      const id = (await User.getUserByUsername(host))._id;
      events = await Event.getByHost(id);
    } else {
      events = await Event.getEvents({});
    }
    return Responses.events(events);
  }

  @Router.post("/events/")
  async createEvent(session: WebSessionDoc, title: string, description: string, location: string, ageReq: string, capacity: string) {
    const user = WebSession.getUser(session);
    const ageInt = parseInt(ageReq);
    const capacityInt = parseInt(capacity);
    const created = await Event.create(user, title, description, location, ageInt, capacityInt);
    return { msg: created.msg, event: await Responses.event(created.event) };
  }

  @Router.patch("/events/edit/:_id")
  async updateEvent(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return await Event.update(_id, update);
  }

  @Router.delete("/events/:_id")
  async deleteEvent(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.delete(_id);
  }

  @Router.patch("/events/:_id/topics/add")
  async addEventTopic(session: WebSessionDoc, _id: ObjectId, topic: string) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.addTopic(_id, topic);
  }

  @Router.patch("/events/:_id/amenities/add")
  async addEventAmenity(session: WebSessionDoc, _id: ObjectId, amenity: string) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.addAmenity(_id, amenity);
  }

  @Router.patch("/events/:_id/accommodations/add")
  async addEventAccommodation(session: WebSessionDoc, _id: ObjectId, accommodation: string) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.addAccommodation(_id, accommodation);
  }

  @Router.patch("/events/:_id/topics/remove")
  async removeEventTopic(session: WebSessionDoc, _id: ObjectId, topic: string) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.removeTopic(_id, topic);
  }

  @Router.patch("/events/:_id/amenities/remove")
  async removeEventAmenity(session: WebSessionDoc, _id: ObjectId, amenity: string) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.removeAmenity(_id, amenity);
  }

  @Router.patch("/events/:_id/accommodations/remove")
  async removeEventAccommodation(session: WebSessionDoc, _id: ObjectId, accommodation: string) {
    const user = WebSession.getUser(session);
    await Event.isHost(user, _id);
    return Event.removeAccommodation(_id, accommodation);
  }

  @Router.patch("/events/:_id/interest/add/")
  async indicateEventInterest(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Event.isNotHost(user, _id);
    await Event.isNotInterested(user, _id);
    return Event.indicateInterest(user, _id);
  }

  @Router.patch("/events/:_id/attendance/add/")
  async indicateEventAttendance(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Event.isNotHost(user, _id);
    await Event.isNotAttending(user, _id);
    return Event.indicateAttendance(user, _id);
  }

  @Router.patch("/events/:_id/interest/remove/")
  async removeEventInterest(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Event.isNotHost(user, _id);
    await Event.isInterested(user, _id);
    return Event.removeInterest(user, _id);
  }

  @Router.patch("/events/:_id/attendance/remove/")
  async removeEventAttendance(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Event.isNotHost(user, _id);
    await Event.isAttending(user, _id);
    return Event.removeAttendance(user, _id);
  }

  // Location

  @Router.get("/location")
  async getLocation(session: WebSessionDoc) {}

  @Router.post("/location")
  async createLocation(source: ObjectId, address: string = "", lat: number, lon: number) {}

  @Router.get("/location/content")
  async getLocationOfContent(content: ObjectId) {}

  @Router.get("/location/address")
  async getLocationFromAddress(address: string) {
    return await Location.getAddressLocation(address);
  }

  @Router.get("/location/distance")
  async getDistance(session: WebSessionDoc, lat: number, lon: number) {}

  // Profile

  @Router.get("/profile")
  async getProfile(session: WebSessionDoc) {}

  @Router.get("/profile/:user")
  async getUserProfile(user: ObjectId) {}

  @Router.post("/profile/create")
  async createProfile(session: WebSessionDoc) {}

  @Router.patch("/profile/edit")
  async editProfile(session: WebSessionDoc, update: Partial<PostDoc>) {}

  @Router.post("/profile/interests/add")
  async addInterest(session: WebSessionDoc, interest: string) {}

  @Router.delete("/profile/interests/remove")
  async removeInterest(session: WebSessionDoc, interest: string) {}

  @Router.post("/profile/add/:content_id")
  async addContent(session: WebSessionDoc, content: ObjectId) {}

  @Router.delete("/profile/remove/:content_id")
  async removeContent(session: WebSessionDoc, content: ObjectId) {}

  // Message

  @Router.post("/message/:otherUser")
  async sendMessage(session: WebSessionDoc, otherUser: string, text: string, files: string[]) {
    const sender = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(otherUser))._id;
    return await Message.send(sender, toId, text, files);
  }

  @Router.get("/message/:otherUser")
  async getMessages(session: WebSessionDoc, otherUser: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(otherUser))._id;
    return await Message.getConversation(user, toId);
  }

  @Router.get("/message/all")
  async getAllMessages(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Message.getMessages({ $or: [{ from: user }, { to: user }] });
  }

  // Feed

  @Router.post("/feed/create")
  async createFeed(session: WebSessionDoc) {}

  @Router.get("/feed")
  async retrieveFeed(session: WebSessionDoc) {}

  // Algorithm

  @Router.get("/:content/relevance")
  async calculateRelevance(session: WebSessionDoc) {}
}

export default getExpressRouter(new Routes());
