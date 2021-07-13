import React from 'react';
import { useCurrentUser } from './components/UserContext';

function App() {
  const user = useCurrentUser();
  const [userName, setUserName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.signIn) return;

    if (user.user) {
      setUserName(user.user.name);
      return;
    }

    user.signIn();
  }, [user]);

  return (
    <div className="App">
      {user?.user ? <div>Signed In as {userName}</div> : <div>Not Signed In!</div>}
    </div>
  );
}

export default App;
