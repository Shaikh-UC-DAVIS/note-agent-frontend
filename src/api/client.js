const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export function getAccessToken() {
  return localStorage.getItem("access_token") || null;
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export function getCurrentUserEmail() {
  return localStorage.getItem("user_email") || null;
}

export function setCurrentUserEmail(email) {
  if (email) {
    localStorage.setItem("user_email", email);
  } else {
    localStorage.removeItem("user_email");
  }
}

export function getCurrentUserName() {
  const first = localStorage.getItem("user_first_name") || "";
  const last = localStorage.getItem("user_last_name") || "";
  return { first_name: first, last_name: last };
}

export function setCurrentUserName({ first_name, last_name } = {}) {
  if (first_name) localStorage.setItem("user_first_name", first_name);
  else localStorage.removeItem("user_first_name");
  if (last_name) localStorage.setItem("user_last_name", last_name);
  else localStorage.removeItem("user_last_name");
}

export async function fetchCurrentUser() {
  return apiRequest("/auth/me", { method: "GET" });
}

async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      (data && data.detail) ||
      data?.error ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function loginWithPassword(email, password) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.detail || data?.error || response.statusText || "Login failed";
    throw new Error(message);
  }

  if (!data.access_token) {
    throw new Error("Missing access token in response");
  }

  setAccessToken(data.access_token);
  setCurrentUserEmail(email);
  return data;
}

export async function registerUser(email, password, { firstName, lastName } = {}) {
  const payload = { email, password };
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setCurrentUserEmail(email);
  setCurrentUserName({ first_name: firstName, last_name: lastName });
  return result;
}

export async function fetchWorkspaces() {
  return apiRequest("/workspaces", { method: "GET" });
}

export async function createWorkspace(name) {
  return apiRequest("/workspaces", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteWorkspace(workspaceId) {
  return apiRequest(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}

export async function fetchNotes(workspaceId, { offset = 0, limit = 50 } = {}) {
  const params = new URLSearchParams();
  params.append("offset", String(offset));
  params.append("limit", String(limit));
  return apiRequest(
    `/workspaces/${workspaceId}/notes?${params.toString()}`,
    { method: "GET" }
  );
}

export async function fetchNote(workspaceId, noteId) {
  return apiRequest(`/workspaces/${workspaceId}/notes/${noteId}`, {
    method: "GET",
  });
}

export async function createNote(workspaceId, { title, raw_text }) {
  return apiRequest(`/workspaces/${workspaceId}/notes`, {
    method: "POST",
    body: JSON.stringify({ title, raw_text }),
  });
}

export async function updateNote(workspaceId, noteId, payload) {
  return apiRequest(`/workspaces/${workspaceId}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(workspaceId, noteId) {
  return apiRequest(`/workspaces/${workspaceId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

export async function fetchNoteInsights(workspaceId, noteId) {
  return apiRequest(`/workspaces/${workspaceId}/notes/${noteId}/insights`, {
    method: "GET",
  });
}

export async function chatWithWorkspace(
  workspaceId,
  { question, history = [], topK = 6 } = {}
) {
  return apiRequest(`/workspaces/${workspaceId}/chat`, {
    method: "POST",
    body: JSON.stringify({ question, history, top_k: topK }),
  });
}

export async function fetchTasks({ workspaceId, startDate, endDate } = {}) {
  const params = new URLSearchParams();

  if (workspaceId) {
    params.append("workspace_id", workspaceId);
  }
  if (startDate) {
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("end_date", endDate);
  }

  const query = params.toString();
  return apiRequest(`/tasks${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function createTask({
  workspace_id,
  title,
  description = null,
  status = "todo",
  due_date = null,
  user_id = null,
  note_id = null,
}) {
  return apiRequest("/tasks", {
    method: "POST",
    body: JSON.stringify({
      workspace_id,
      title,
      description,
      status,
      due_date,
      user_id,
      note_id,
    }),
  });
}

export async function updateTask(taskId, payload) {
  return apiRequest(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
