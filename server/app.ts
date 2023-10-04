import EventConcept from "./concepts/event";
import FriendConcept from "./concepts/friend";
import MessageConcept from "./concepts/message";
import PostConcept from "./concepts/post";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Message = new MessageConcept();
export const Event = new EventConcept();
