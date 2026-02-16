// src/utils/authRequest.js

import { auth } from "../firebase/firebase";

// make authenticated requests
export async function authRequest(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken(); // get Firebase ID token

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  return fetch(url, { ...options, headers });
}

