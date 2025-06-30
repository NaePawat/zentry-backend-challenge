import UserButton from "./components/userButton";

const Home = async() => {
  const res = await fetch('http://localhost:5000/api/users/');
  const resJson = await res.json();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-center sm:text-left">
          Welcome to{" "}
          <span className="text-foreground/80 white:text-foreground/60">
            Bacefook
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-center sm:text-left text-foreground/70 dark:text-foreground/50">
          Users
        </p>
        <div className="grid grid-cols-4 gap-[4px]">
          {resJson.users.map((user: any) => 
            <UserButton key={user.id} username={user.username}/>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;