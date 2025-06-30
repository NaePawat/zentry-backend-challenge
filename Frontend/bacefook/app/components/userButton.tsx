"use client";

import { useRouter } from 'next/navigation';
import Image from "next/image";

const UserButton = ({ username }: { username: string }) => {
  const router = useRouter();
  const handleUserClick = () => {
    // Navigate to the user's page
    console.log(`Navigating to user: ${username}`);
    router.push(`/${username}`);
  };

  return (
    <button
      className="rounded-full border cursor-pointer border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
      onClick={handleUserClick}
      rel="noopener noreferrer"
    >
      <Image
        className="dark:invert"
        src="/chill-guy.png"
        alt="Bro's chillin"
        width={20}
        height={20}
      />
      {username}
    </button>
  );
}

export default UserButton;