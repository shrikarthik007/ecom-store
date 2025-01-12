import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // send cookies to the server
});
console.log("Axios is set to use baseURL:", axiosInstance.defaults.baseURL);

export default axiosInstance;
