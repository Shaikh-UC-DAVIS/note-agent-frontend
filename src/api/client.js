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
  return data;
}

export async function registerUser(email, password) {
  const payload = { email, password };
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
