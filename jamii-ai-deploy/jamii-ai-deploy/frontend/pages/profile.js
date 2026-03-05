// pages/profile.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import ProfilePage from "../components/JamiiAIProfile";

export default function Profile() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("jamii_token");
    if (!token) router.replace("/auth");
  }, []);

  return <ProfilePage />;
}
