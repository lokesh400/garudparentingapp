import axios from "axios";

export const API = axios.create({
  baseURL: "https://garudclasseserp.onrender.com",
  withCredentials: true,
});

// export const API = axios.create({
//   baseURL: "http://172.27.32.198:4000",
//   withCredentials: true,
// })



