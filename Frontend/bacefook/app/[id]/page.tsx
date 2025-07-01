import React from 'react';
import UserButton from '../components/userButton';
import Chart from '../components/chart';

const UserPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  //get user data from the API
  const userDataRes = await fetch(`http://localhost:5000/api/users/${id}`);
  const userDataJson = await userDataRes.json();
  
  //get top 3 friends from the API
  const topThreeFriendsRes = await fetch(`http://localhost:5000/api/users/${id}/friends/top-influential`);
  const topThreeFriendsJson = await topThreeFriendsRes.json();

  //TODO: date selection feature is not implemented, this should be fetch later when user input the time range
  const friendsTimeSeriesData = await fetch(`http://localhost:5000/api/users/${id}/friends/graph?from=2025-06-29T03:00:00Z&to=2025-07-30T22:00:00Z`)
  const friendsTimeSeriesDataJson = await friendsTimeSeriesData.json();

  //TODO: date selection feature is not implemented, this should be fetch later when user input the time range
  const referralsTimeSeriesData = await fetch(`http://localhost:5000/api/users/${id}/referrals/graph?from=2025-06-29T03:00:00Z&to=2025-07-30T22:00:00Z`)
  const referralsTimeSeriesDataJson = await referralsTimeSeriesData.json();

  return (
    <div>
        <main>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-center sm:text-left">
            User Profile {userDataJson.user.username}
        </h1>

        <section className="my-4">
            <p className="text-md text-center sm:text-left text-foreground/60 dark:text-foreground/40">
                Network Strength: {userDataJson.user.networkStrength} <br />
                Referral Points: {userDataJson.user.referralPoints} <br />
                Referred By: {userDataJson.referredBy != null ? userDataJson.referredBy.username : "None"}
            </p>
        </section>

        <p className="mt-4 text-lg sm:text-xl text-center sm:text-left text-foreground/70 dark:text-foreground/50">
            Top 3 Influential Friends!
        </p>

        <ul className="list-disc pl-5">
            {topThreeFriendsJson.friends.map((friend: any, index: number) => (
            <li key={friend.id}>
                #{index + 1} {friend.username} - network strength = {friend.networkStrength}
            </li>
            ))}
        </ul>
        </main>

        <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-2">Friends</h2>
            <ul className="list-disc pl-5 space-y-1">
                {userDataJson.friends.map((friend: any) => (
                    <UserButton key={friend.id} username={friend.username}/>
                ))}
            </ul>
        </section>

        <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-2">Referrals</h2>
            <ul className="list-disc pl-5 space-y-1">
                {userDataJson.referrals.map((ref: any) => (
                    <li key={ref.id}>{ref.username}</li>
                ))}
            </ul>
        </section>
        <Chart name='Friends Count' data={friendsTimeSeriesDataJson}/>
        <Chart name='Referrals Count' data={referralsTimeSeriesDataJson}/>
    </div>
  );
};

export default UserPage;