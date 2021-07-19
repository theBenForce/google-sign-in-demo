
import React from "react";
import { Auth, Hub } from "aws-amplify";
import { CognitoUser, CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import { inspect } from "util";
import jwtDecode from "jwt-decode";


interface TokenValues {
  exp: number;
  sub: string;
  iss: string;
}

type UserContextValue = {
  user: { id: string; name: string; token: string; } | null;
  signIn: () => Promise<void>;
} | null;

const UserContext = React.createContext<UserContextValue>(null);

const getUser = async (): Promise<CognitoUser | null> => {
  try {
    const user = await Auth.currentAuthenticatedUser();

    return user;
  } catch (ex) {
    console.log(`Not signed in`, ex);
  }

  return null;
};

export const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = React.useState<CognitoUser | null>(null);
  const [isInitialized, setInitialized] = React.useState(false);



  React.useEffect(() => {
    getUser().then((user) => {
      setUser(user);


      // AppleID.auth.init({
      //   clientId: process.env.REACT_APP_APPLE_CLIENT_ID!,
      //   scope: "name email",
      //   redirectURI: window.location.origin,
      //   state: "{}",
      //   usePopup: true,
      // });

      setInitialized(true);
    });


    const authListener = ({ payload: { event, data } }: { payload: { event: string; data?: CognitoUser; } }) => {
      switch (event) {
        case "signIn":
        case "cognitoHostedUI":
          getUser().then(setUser);
          break;
        case "signOut":
          setUser(null)
          break;
        case "signIn_failure":
        case "cognitoHostedUI_failure":
          console.error(`Sign in failure`, data);
          break;
      }
    };

    Hub.listen("auth", authListener);

    return () => {
      Hub.remove("auth", authListener);
    };

  }, []);

  let value: UserContextValue = null;

  if (isInitialized) {
    value = {
      // @ts-ignore
      user: user,
      async signIn() {
        // const {
        //   authorization: { id_token },
        // } = await AppleID.auth.signIn();

        // const tokenData = jwtDecode<TokenValues>(id_token);

        await Auth.federatedSignIn({
          provider: CognitoHostedUIIdentityProvider.Google,
        });
      }
    }
  }

  return <UserContext.Provider value={value} children={children} />;
};

export const useCurrentUser = () => React.useContext(UserContext);