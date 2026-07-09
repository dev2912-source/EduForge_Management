"use server";
import { cookies } from "next/headers";

export async function loginUser(identifier, password) {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Set HttpOnly cookie for the token
      const cookieStore = await cookies();
      cookieStore.set("token", data.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/" 
      });
      
      // Set a regular cookie for the user data so the client can easily read basic info
      cookieStore.set("user", JSON.stringify({
        id: data._id, role: data.role, name: data.name, email: data.email, schoolId: data.schoolId
      }), { path: "/" });

      return { success: true, user: data };
    } else {
      return { success: false, error: data.message || "Invalid credentials" };
    }
  } catch (error) {
    return { success: false, error: "Server connection failed." };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("user");
}
