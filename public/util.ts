type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login with Address",
    endpoint: "/api/login/address",
    method: "POST",
    fields: { username: "input", password: "input", address: "input" },
  },
  {
    name: "Login with Coordinates",
    endpoint: "/api/login/coords",
    method: "POST",
    fields: { username: "input", password: "input", latitude: "input", longitude: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Post Feed",
    endpoint: "/api/feed/posts",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Own Profile",
    endpoint: "api/profile",
    method: "GET",
    fields: {},
  },
  {
    name: "Edit Profile",
    endpoint: "api/profile/edit",
    method: "PATCH",
    fields: { update: { name: "input", bio: "input", location: "input" }, birthdate: "input" },
  },
  {
    name: "Add Interest to Profile",
    endpoint: "api/profile/interests/add",
    method: "PATCH",
    fields: { interest: "input" },
  },
  {
    name: "Remove Interest from Profile",
    endpoint: "api/profile/interests/remove",
    method: "PATCH",
    fields: { interest: "input" },
  },
  {
    name: "Get All Profiles",
    endpoint: "api/profile/all",
    method: "GET",
    fields: {},
  },
  {
    name: "Get User Profile",
    endpoint: "api/profile/user/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Update Current Location",
    endpoint: "/api/location",
    method: "PATCH",
    fields: { address: "input" },
  },
  {
    name: "Get Current Location",
    endpoint: "/api/location",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Location from Id",
    endpoint: "/api/location/poi/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Get Distance To (in meters)",
    endpoint: "/api/location/distance/:destinationId",
    method: "GET",
    fields: { destinationId: "input" },
  },
  {
    name: "Get Location from Address",
    endpoint: "/api/location/address",
    method: "GET",
    fields: { address: "input" },
  },
  {
    name: "Get Events (empty for all)",
    endpoint: "/api/events",
    method: "GET",
    fields: { host: "input" },
  },
  {
    name: "Get Nearby Events (empty for 10km)",
    endpoint: "/api/events/nearby",
    method: "GET",
    fields: { radius: "input" },
  },
  {
    name: "Get Upcoming Events",
    endpoint: "/api/events/upcoming",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Ongoing Events",
    endpoint: "/api/events/ongoing",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Events You are Currently Attending",
    endpoint: "/api/events/at",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Your Interested Events",
    endpoint: "/api/events/interested",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Your Attending Events",
    endpoint: "/api/events/attending",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Get Post (with comments)",
    endpoint: "/api/posts/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Get Nearby Posts (empty for 10km)",
    endpoint: "/api/posts/nearby",
    method: "GET",
    fields: { radius: "input" },
  },
  {
    name: "Get Messages with User",
    endpoint: "/api/message/:TargetUser",
    method: "GET",
    fields: { TargetUser: "input" },
  },
  {
    name: "Get All Messages",
    endpoint: "/api/message/all",
    method: "GET",
    fields: {},
  },
  {
    name: "Send Message",
    endpoint: "/api/message/:SendTo",
    method: "POST",
    fields: { SendTo: "input", text: "input" },
  },
  {
    name: "Indicate Event Interest",
    endpoint: "/api/events/:id/interest/add",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Remove Event Interest",
    endpoint: "/api/events/:id/interest/remove",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Indicate Event Attendance",
    endpoint: "/api/events/:id/attendance/add",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Remove Event Attendance",
    endpoint: "/api/events/:id/attendance/remove",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input", replyTo: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Create Event",
    endpoint: "/api/events",
    method: "POST",
    fields: { title: "input", description: "input", location: "input", startTime: "input", endTime: "input", ageReq: "input", capacity: "input" },
  },
  {
    name: "Update Event",
    endpoint: "/api/events/:id/edit",
    method: "PATCH",
    fields: {
      id: "input",
      update: { title: "input", description: "input", location: "input", ageReq: "input", capacity: "input" },
      startTime: "input",
      endTime: "input",
    },
  },
  {
    name: "Add Event Topic",
    endpoint: "/api/events/:id/topics/add",
    method: "PATCH",
    fields: { id: "input", topic: "input" },
  },
  {
    name: "Add Event Amenity",
    endpoint: "/api/events/:id/amenities/add",
    method: "PATCH",
    fields: { id: "input", amenity: "input" },
  },
  {
    name: "Add Event Accommodation",
    endpoint: "/api/events/:id/accommodations/add",
    method: "PATCH",
    fields: { id: "input", accommodation: "input" },
  },
  {
    name: "Remove Event Topic",
    endpoint: "/api/events/:id/topics/remove",
    method: "PATCH",
    fields: { id: "input", topic: "input" },
  },
  {
    name: "Remove Event Amenity",
    endpoint: "/api/events/:id/amenities/remove",
    method: "PATCH",
    fields: { id: "input", amenity: "input" },
  },
  {
    name: "Remove Event Accommodation",
    endpoint: "/api/events/:id/accommodations/remove",
    method: "PATCH",
    fields: { id: "input", accommodation: "input" },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Delete Event",
    endpoint: "/api/events/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
