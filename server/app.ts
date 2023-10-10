import AlgorithmConcept from "./concepts/algorithm";
import EventConcept from "./concepts/event";
import FriendConcept from "./concepts/friend";
import LocationConcept from "./concepts/location";
import MessageConcept from "./concepts/message";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Message = new MessageConcept();
export const Event = new EventConcept();
export const Location = new LocationConcept();
export const Profile = new ProfileConcept();
export const Algorithm = new AlgorithmConcept();
