import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Amplify from "aws-amplify";

Amplify.configure({
  Auth: {
    identityPoolId: process.env.AWS_IDENTITY_POOL_ID,
    region: "us-east-1",
    mandatorySignIn: true,
  },
  Storage: {
    AWSS3: {
      bucket: process.env.STORAGE_BUCKET,
      region: "us-east-1",
    },
  },
  federationTarget: "COGNITO_USER_POOLS",
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
