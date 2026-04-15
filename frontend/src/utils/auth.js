export const setAuth = (data) => {
  const token = data?.access_token || data?.token;
  const user = data?.user || null;

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