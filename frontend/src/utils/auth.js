const extractAuthPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload;
};

export const setAuth = (payload) => {
  const authData = extractAuthPayload(payload);
  const token = authData?.access_token || authData?.token;
  const user = authData?.user || null;

  if (token) {
    localStorage.setItem("token", token);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};