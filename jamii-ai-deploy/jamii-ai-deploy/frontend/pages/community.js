// pages/community.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import JamiiAICommunity from "../components/JamiiAICommunity";

export default function CommunityPage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("jamii_token");
    if (!token) router.replace("/auth");
  }, []);

  return <JamiiAICommunity />;
}
