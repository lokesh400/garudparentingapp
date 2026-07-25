import axios from "axios";

export const API = axios.create({
  baseURL: "https://p.garudclasses.com",
  withCredentials: true,
});




