export const handleApiError = (err, navigate) => {
  if (err.response?.status === 403) {
    alert("Your role is not sufficient for this task.");
  } else if (err.response?.status === 401) {
    alert("Session expired. Please login again.");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("avatar");
    navigate("/");
  } else if (err.response?.status === 429) {
    alert("Too many requests. Please wait a moment.");
  } else if (err.response?.status === 500) {
    alert("Server error. Please try again.");
  } else {
    alert(err.response?.data?.message || "Something went wrong.");
  }
};