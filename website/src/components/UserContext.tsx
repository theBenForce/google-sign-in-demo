
import React from "react";
import { Auth, Hub } from "aws-amplify";
import { CognitoUser, CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import { inspect } from "util";
import jwtDecode from "jwt-decode";
import { GoogleLoginResponse, GoogleLoginResponseOffline, useGoogleLogin } from 'react-google-login'


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

function isGoogleLoginResponse(value: any): value is GoogleLoginResponse {
  return value.getAuthResponse;
}

export const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = React.useState<CognitoUser | null>(null);
  const [isInitialized, setInitialized] = React.useState(false);

  const onSuccess = React.useCallback(async (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    console.info(JSON.stringify(response, null, 2));

    if (isGoogleLoginResponse(response)) {
      const { expires_at, id_token } = response.getAuthResponse();

      await Auth.federatedSignIn(
        "google",
        {
          token: id_token,
          expires_at,
        },
        response.profileObj
      );
    }
  }, []);

  const { signIn: googleSignIn, loaded: googleSignInLoaded } = useGoogleLogin({
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
    onSuccess,
  });

  React.useEffect(() => {
    setInitialized(googleSignInLoaded);
  }, [googleSignInLoaded]);


  React.useEffect(() => {
    getUser().then((user) => {
      setUser(user);
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
        googleSignIn();
      }
    }
  }

  return <UserContext.Provider value={value} children={children} />;
};

export const useCurrentUser = () => React.useContext(UserContext);