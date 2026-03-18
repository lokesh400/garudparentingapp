import axios from "axios";

export const API = axios.create({
  baseURL: "https://garudclasseserp.onrender.com",
  withCredentials: true,
});

// export const API = axios.create({
//   baseURL: "http://172.29.207.198:4000",
//   withCredentials: true,
// });



