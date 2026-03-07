import React, { useState } from "react";
import { usersAPI } from "../lib/api";
import { toast } from "react-hot-toast";

export default function FollowButton({ userId, initialFollowing = false, onToggle }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data } = await usersAPI.follow(userId);
      setFollowing(data.following);
      onToggle?.(data);
      if (data.following) toast.success("Umejumuika!");
    } catch (err) { 
      console.error(err);
      toast.error("Imeshindwa kubadili hali ya kufuata");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <button 
      onClick={toggle} 
      disabled={loading} 
      className={`px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 ${
        following 
          ? "bg-transparent text-white/40 border border-white/10 hover:border-red-500/50 hover:text-red-500" 
          : "bg-[#F5A623] text-black hover:bg-[#e8961a] shadow-[0_0_20px_rgba(245,166,35,0.2)]"
      } ${loading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
    >
      {loading ? "..." : following ? "Unafuata" : "+ Fuata"}
    </button>
  );
}
