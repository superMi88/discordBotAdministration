import { useState, useEffect } from "react";
import {jwtDecode} from 'jwt-decode';
import cookie from "js-cookie";

function useDecodedToken(cookieName = "jwt") {
  const [decodedToken, setDecodedToken] = useState(null);

  useEffect(() => {
    const token = cookie.get(cookieName);
    if (token) {
      try {
        setDecodedToken(jwtDecode(token));
      } catch (err) {
        console.error("Invalid JWT:", err);
      }
    }
  }, [cookieName]);

  return decodedToken;
}

export { useDecodedToken };
