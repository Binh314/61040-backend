import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Algorithm, Event, Friend, Location, Message, Post, Profile, User, WebSession } from "./app";
import { BadValuesError, NotAllowedError, NotFoundError } from "./concepts/errors";
import { EventDoc } from "./concepts/event";
import { LocationDoc } from "./concepts/location";
import { PostDoc } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
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
    const user = await User.create(username, password);
    if (!user.user) throw new Error("User register error"); // should not ever be thrown
    Profile.create(user.user._id, username);
    return user;
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    Profile.delete(new ObjectId(user.toString()));
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login/address")
  async logInWithAddress(session: WebSessionDoc, username: string, password: string, address: string) {
    const u = await User.authenticate(username, password);
    const location = await Location.getFromAddress(address);
    await Location.create(u._id, "user", location.lat, location.lon);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/login/coords")
  async logInWithCoords(session: WebSessionDoc, username: string, password: string, latitude: string, longitude: string) {
    const u = await User.authenticate(username, password);
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    await Location.create(u._id, "user", lat, lon);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    Location.delete(user);
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

  @Router.get("/posts/:_id")
  async getPost(_id: string) {
    const id = new ObjectId(_id);
    const post = await Post.getPost(id);
    const comments = await Post.getPosts({ replyTo: id });
    return { post: await Responses.post(post), comments: await Responses.posts(comments) };
  }

  @Router.get("/posts/nearby")
  async getNearbyPosts(session: WebSessionDoc, radius: string) {
    const user = WebSession.getUser(session);
    const locations: LocationDoc[] = await Location.getNearby(user, "post", radius ? parseFloat(radius) : 10);
    const postIds = locations.map((loc) => loc.poi);
    const query = { _id: { $in: postIds } };
    const posts = await Post.getPosts(query);
    return Responses.posts(posts);
  }

  /**
   * @param files string of file urls separated by commas ","
   * @param replyTo post ID
   */
  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, files?: string, replyTo?: string) {
    const user = WebSession.getUser(session);

    const location = await Location.get(user);
    let replyId = undefined;
    if (replyTo) replyId = new ObjectId(replyTo);

    const filesArray = files
      ? files
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e)
      : [];

    const created = await Post.create(user, content, filesArray, replyId);
    await Location.create(created.id, "post", location.lat, location.lon);

    Profile.addPost(user, created.id);

    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    const location = await Location.get(new ObjectId(user.toString()));
    await Location.create(user, "post", location.lat, location.lon);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);

    await Location.delete(_id);

    await Profile.removePost(user, _id);
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

  @Router.get("/events/nearby")
  async getNearbyEvents(session: WebSessionDoc, radius: string) {
    const user = WebSession.getUser(session);
    const locations: LocationDoc[] = await Location.getNearby(user, "event", radius ? parseFloat(radius) : 10);
    const eventIds = locations.map((loc) => loc.poi);
    const query = { _id: { $in: eventIds } };
    const events = await Event.getEvents(query);
    return Responses.events(events);
  }

  @Router.get("/events/upcoming")
  async getUpcomingEvents(session: WebSessionDoc) {
    const timeNow = new Date();
    const events = await Event.getEvents({ startTime: { $gt: timeNow } });
    return Responses.events(events);
  }

  @Router.get("/events/ongoing")
  async getOngoingEvents(session: WebSessionDoc) {
    const timeNow = new Date();
    const events = await Event.getEvents({ startTime: { $lte: timeNow }, endTime: { $gte: timeNow } });
    return Responses.events(events);
  }

  @Router.get("/events/interested")
  async getInterestedEvents(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const timeNow = new Date();
    const events = await Event.getEvents({ endTime: { $gte: timeNow }, interested: { $in: [user] } });
    return Responses.events(events);
  }
  @Router.get("/events/attending")
  async getAttendingEvents(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const timeNow = new Date();
    const events = await Event.getEvents({ endTime: { $gte: timeNow }, attending: { $in: [user] } });
    return Responses.events(events);
  }

  /**
   * Gets events that are ongoing and that the user is attending and at
   */
  @Router.get("/events/at")
  async getCurrentEvents(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const timeNow = new Date();
    const locations = await Location.getAtLocation(user, "event");
    const eventIds = locations.map((location) => location.poi);
    const query = { _id: { $in: eventIds }, startTime: { $lte: timeNow }, endTime: { $gte: timeNow }, attending: { $in: [user] } };
    const events = await Event.getEvents(query);
    return Responses.events(events);
  }

  /**
   * @param location address or name of location that can be found on google maps
   * @param startTime "yyyy/mm/dd hh:mm timezone" format. time uses 24-hour time
   * @param endTime "yyyy/mm/dd hh:mm timezone" format. time uses 24-hour time
   */
  @Router.post("/events")
  async createEvent(session: WebSessionDoc, title: string, description: string, location: string, startTime: string, endTime: string, ageReq: string, capacity: string, photo?: string) {
    const user = WebSession.getUser(session);
    const ageInt = parseInt(ageReq);
    const capacityInt = parseInt(capacity);
    const loc = await Location.getFromAddress(location);

    const startTimestamp = Date.parse(startTime);
    const endTimestamp = Date.parse(endTime);
    if (!startTimestamp) throw new BadValuesError("Could Not Parse Start Time");
    if (!endTimestamp) throw new BadValuesError("Could Not Parse End Time");
    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);

    const created = await Event.create(user, title, description, location, start, end, ageInt, capacityInt, photo);
    await Location.create(created.id, "event", loc.lat, loc.lon, location);
    return { msg: created.msg, event: await Responses.event(created.event) };
  }

  /**
   * @param location address or name of location that can be found on google maps
   * @param startTime "yyyy/mm/dd hh:mm timezone" format. time uses 24-hour time
   * @param endTime "yyyy/mm/dd hh:mm timezone" format. time uses 24-hour time
   */
  @Router.patch("/events/:_id/edit")
  async updateEvent(session: WebSessionDoc, _id: string, update: Partial<EventDoc>, startTime: string, endTime: string) {
    const user = WebSession.getUser(session);
    const id = new ObjectId(_id.toString());
    await Event.isHost(user, id);
    if (!update.location) throw new BadValuesError("No location given.");
    const loc = await Location.getFromAddress(update.location);
    await Location.create(id, "event", loc.lat, loc.lon);

    const startTimestamp = Date.parse(startTime);
    const endTimestamp = Date.parse(endTime);
    if (!startTimestamp) throw new BadValuesError("Could Not Parse Start Time");
    if (!endTimestamp) throw new BadValuesError("Could Not Parse End Time");
    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);

    const newUpdate = { ...update, startTime: start, endTime: end };

    return await Event.update(id, newUpdate);
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
  async getLocation(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const location = Location.get(user);
    return location;
  }

  @Router.patch("/location")
  async updateLocation(session: WebSessionDoc, address: string) {
    const user = WebSession.getUser(session);
    const addressLocation = await Location.getFromAddress(address);
    await Location.update(user, { location: addressLocation });
    return { msg: "Location updated successfully" };
  }

  @Router.get("/location/poi/:poi")
  async getLocationFromID(poi: string) {
    // const user = await User.getUserById(poi);
    // const id = user._id;
    const locations = Location.get(new ObjectId(poi));
    return locations;
  }

  @Router.get("/location/distance/:poi")
  async getDistance(session: WebSessionDoc, poi: string) {
    const user = WebSession.getUser(session);
    const distance = Location.getDistance(user, new ObjectId(poi));
    return distance;
  }

  @Router.get("/location/address")
  async getLocationFromAddress(address: string) {
    return await Location.getFromAddress(address);
  }

  // Profile

  @Router.get("/profile")
  async getProfile(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const profile = await Profile.getProfile(user);
    return Responses.profile(profile);
  }

  @Router.get("/profile/user/:username")
  async getUserProfile(username: string) {
    const person = await User.getUserByUsername(username);
    if (!person) throw new NotFoundError("User not found");
    const profile = await Profile.getProfile(person._id);
    return Responses.profile(profile);
  }
  @Router.get("/profile/all")
  async getAllProfiles(username: string) {
    const profiles = await Profile.getProfiles({});
    return Responses.profiles(profiles);
  }

  /**
   * @param birthdate yyyy/mm/dd format
   */
  @Router.patch("/profile/edit")
  async updateProfile(session: WebSessionDoc, update: Partial<ProfileDoc>, birthdate?: string) {
    const user = WebSession.getUser(session);
    const date = birthdate ? new Date(birthdate) : undefined;
    await Profile.update(user, update);
    await Profile.update(user, { birthdate: date });
    return { msg: "Profile successfully updated." };
  }

  @Router.patch("/profile/interests/add")
  async addInterest(session: WebSessionDoc, interest: string) {
    const user = WebSession.getUser(session);
    await Profile.addInterest(user, interest);
    return { msg: "Interest added successfully" };
  }

  @Router.patch("/profile/interests/remove")
  async removeInterest(session: WebSessionDoc, interest: string) {
    const user = WebSession.getUser(session);
    await Profile.removeInterest(user, interest);
    return { msg: "Interest removed successfully." };
  }

  // Message

  @Router.post("/message/:otherUser")
  async sendMessage(session: WebSessionDoc, otherUser: string, text: string, files?: string) {
    const sender = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(otherUser))._id;
    const filesArray = files
      ? files
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e)
      : [];
    return await Message.send(sender, toId, text, filesArray);
  }

  @Router.get("/message/user/:otherUser")
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

  // Normal Feed

  @Router.get("/feed/posts")
  async getPostFeed(session: WebSessionDoc) {
    const user = await WebSession.getUser(session);

    // getting data required for algorithm
    const userProfile = await Profile.getProfile(user);
    const userInterests = userProfile ? userProfile.interests : [];

    const posts = await Post.getPosts({ author: { $ne: user } }); // exclude posts by user
    const profiles = await Profile.getProfiles({ person: { $in: posts.map((post) => post.author) } });
    const profileMap = new Map(profiles.map((profile) => [profile.person.toString(), profile]));

    const postTags = new Map(
      posts.map((post) => {
        const profile = profileMap.get(post.author.toString());
        const tags = profile ? profile.interests : [];
        return [post._id.toString(), tags];
      }),
    );
    const postDates = new Map(posts.map((post) => [post._id.toString(), post.dateCreated]));
    const postMap = new Map(posts.map((post) => [post._id.toString(), post]));

    const postDistances = await Location.getDistances(
      user,
      posts.map((post) => post._id),
    );

    // running algorithm
    const sortedPostIds = await Algorithm.sortContent(userInterests, postTags, postDistances, postDates);

    // returning sorted posts
    const sortedPosts: PostDoc[] = [];
    for (const id of sortedPostIds) {
      const post = postMap.get(id.toString());
      if (!post) throw new Error("Post id not found. Should not be thrown.");
      sortedPosts.push(post);
    }
    return Responses.posts(sortedPosts);
  }

  @Router.get("/feed/events")
  async getEventFeed(session: WebSessionDoc) {
    const user = await WebSession.getUser(session);

    // getting data required for algorithm
    const userProfile = await Profile.getProfile(user);
    const userInterests = userProfile ? userProfile.interests : [];

    const timeNow = new Date();
    // exclude posts by user and get events that have not ended
    const events = await Event.getEvents({ host: { $ne: user }, endTime: { $gte: timeNow } });

    const eventDates = new Map(events.map((event) => [event._id.toString(), event.startTime]));
    const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
    const eventTags = new Map(events.map((event) => [event._id.toString(), event.topics]));

    const eventDistances = await Location.getDistances(
      user,
      events.map((event) => event._id),
    );

    // running algorithm
    const sortedEventIds = await Algorithm.sortContent(userInterests, eventTags, eventDistances, eventDates);

    // returning sorted posts
    const sortedEvents: EventDoc[] = [];
    for (const id of sortedEventIds) {
      const event = eventMap.get(id.toString());
      if (!event) throw new Error("Event id not found. Should not be thrown.");
      sortedEvents.push(event);
    }
    return Responses.events(sortedEvents);
  }

  // Event Mode Feed
  @Router.get("/feed/eventmode/posts")
  async getPostEventFeed(session: WebSessionDoc) {
    const user = await WebSession.getUser(session);

    // getting data required for algorithm

    // get users attending the event(s)
    const timeNow = new Date();
    const ongoingEvents = await Event.getEvents({ startTime: { $lte: timeNow }, endTime: { $gte: timeNow }, $or: [{ attending: { $in: [user] } }, { host: user }] });
    const eventsAtLocation = (await Location.getAtLocation(user, "event")).map((loc) => loc.poi.toString());
    const attendingEvents = ongoingEvents.filter((event) => eventsAtLocation.includes(event._id.toString()));

    if (attendingEvents.length === 0) throw new NotAllowedError("Not currently at an event.");

    const stringAttendees = attendingEvents.map((event) => event.attending.map((id) => id.toString())).flat();
    const locationsAtEvent = await Location.getAtLocation(user, "user");
    const usersAtEvent = locationsAtEvent.map((loc) => loc.poi);

    const usersAttendingEvent = usersAtEvent.filter((id) => stringAttendees.includes(id.toString()));

    // exclude posts by user, only get posts from people attending event
    const posts = await Post.getPosts({ $and: [{ author: { $ne: user } }, { author: { $in: usersAttendingEvent } }] });

    const userProfile = await Profile.getProfile(user);
    const userInterests = userProfile ? userProfile.interests : [];
    const profiles = await Profile.getProfiles({ person: { $in: posts.map((post) => post.author) } });
    const profileMap = new Map(profiles.map((profile) => [profile.person.toString(), profile]));

    const postTags = new Map(
      posts.map((post) => {
        const profile = profileMap.get(post.author.toString());
        const tags = profile ? profile.interests : [];
        return [post._id.toString(), tags];
      }),
    );
    const postDates = new Map(posts.map((post) => [post._id.toString(), post.dateCreated]));
    const postMap = new Map(posts.map((post) => [post._id.toString(), post]));

    const postDistances = await Location.getDistances(
      user,
      posts.map((post) => post._id),
    );

    // running algorithm
    const sortedPostIds = await Algorithm.sortContent(userInterests, postTags, postDistances, postDates);

    // returning sorted posts
    const sortedPosts: PostDoc[] = [];
    for (const id of sortedPostIds) {
      const post = postMap.get(id.toString());
      if (!post) throw new Error("Post id not found. Should not be thrown.");
      sortedPosts.push(post);
    }
    return Responses.posts(sortedPosts);
  }

  @Router.get("/feed/eventmode/profiles")
  async getProfileEventFeed(session: WebSessionDoc) {
    const user = await WebSession.getUser(session);

    // getting data required for algorithm

    // get users attending the event(s)
    const timeNow = new Date();
    const ongoingEvents = await Event.getEvents({ startTime: { $lte: timeNow }, endTime: { $gte: timeNow }, $or: [{ attending: { $in: [user] } }, { host: user }] });
    const eventsAtLocation = (await Location.getAtLocation(user, "event")).map((loc) => loc.poi.toString());
    const attendingEvents = ongoingEvents.filter((event) => eventsAtLocation.includes(event._id.toString()));

    if (attendingEvents.length === 0) throw new NotAllowedError("Not currently at an event.");

    const stringAttendees = attendingEvents.map((event) => event.attending.map((id) => id.toString())).flat();
    const locationsAtEvent = await Location.getAtLocation(user, "user");
    const usersAtEvent = locationsAtEvent.map((loc) => loc.poi);

    const usersAttendingEvent = usersAtEvent.filter((id) => stringAttendees.includes(id.toString()));

    // exclude posts by user, only get profiles from people attending event
    const profiles = await Profile.getProfiles({ $and: [{ person: { $ne: user } }, { person: { $in: usersAttendingEvent } }] });

    const profileMap = new Map(profiles.map((profile) => [profile.person.toString(), profile]));

    const userProfile = await Profile.getProfile(user);
    const userInterests = userProfile ? userProfile.interests : [];
    const profileTags = new Map(profiles.map((profile) => [profile.person.toString(), profile.interests]));
    const profileDates = new Map(profiles.map((profile) => [profile.person.toString(), timeNow]));

    const userDistances = await Location.getDistances(user, usersAtEvent);

    // running algorithm
    const sortedUserIds = await Algorithm.sortContent(userInterests, profileTags, userDistances, profileDates);

    // returning sorted posts
    const sortedProfiles: ProfileDoc[] = [];
    for (const id of sortedUserIds) {
      const profile = profileMap.get(id.toString());
      if (!profile) throw new Error("Profile id not found. Should not be thrown.");
      sortedProfiles.push(profile);
    }
    return Responses.profiles(sortedProfiles);
  }

  // Algorithm
  @Router.get("/:content/relevance")
  async calculateRelevance(session: WebSessionDoc) {}
}

export default getExpressRouter(new Routes());
