import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";


const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

export default function GoogleLogin({ onSuccess }) {
  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById("google-btn"),
      {
        theme: "outline",
        size: "large",
        width: "300",
      }
    );
  }, []);

  const handleResponse = (response) => {
    const user = jwtDecode(response.credential);

    const googleUser = {
      name: user.name,
      email: user.email,
      picture: user.picture,
      googleId: user.sub,
      token: response.credential,
    };

    console.log("Google User:", googleUser);

    onSuccess(googleUser);
  };

  return <div id="google-btn"></div>;
}
