import React from 'react';
import { useCurrentUser } from './components/UserContext';
import { ImageList } from './pages/ImageList';

function App() {
  const user = useCurrentUser();

  React.useEffect(() => {
    if (!user?.signIn || user.user) return;

    user.signIn();
  }, [user]);

  if (user?.user) {
    return <ImageList />
  }

  return (
    <div className="App">
      <div>Not Signed In!</div>
    </div>
  );
}

export default App;
