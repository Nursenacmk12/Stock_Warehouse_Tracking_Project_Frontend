import { request, toApiResult } from "./apiClient.js";

export async function fetchUsers() {
  return toApiResult(request("/api/users"));
}

export async function fetchRoles() {
  return toApiResult(request("/api/users/roles"));
}

export async function createUser(payload) {
  return toApiResult(request("/api/users", { method: "POST", body: payload }));
}

export async function updateUser(id, payload) {
  return toApiResult(request(`/api/users/${id}`, { method: "PUT", body: payload }));
}

export async function changeUserRole(id, roleId) {
  return toApiResult(request(`/api/users/${id}/role`, { method: "PUT", body: { roleId } }));
}

export async function deleteUser(id) {
  return toApiResult(request(`/api/users/${id}`, { method: "DELETE" }));
}
