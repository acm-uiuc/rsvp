import React from "react";
import { Link } from "react-router-dom";

import brandImgUrl from "../../assets/banner-blue.png";
import brandWhiteImgUrl from "../../assets/banner-white.png";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";

interface LogoBadgeProps {
  size?: string;
  linkTo?: string;
  showText?: boolean;
}

export const LogoBadge: React.FC<LogoBadgeProps> = ({
  size,
  linkTo,
  showText,
}) => {
  const isNonProd = import.meta.env.VITE_RUN_ENVIRONMENT !== "prod";
  if (!showText) {
    showText = true;
  }
  if (!size) {
    size = "1em";
  }
  const runEnv = import.meta.env.VITE_RUN_ENVIRONMENT;
  return (
    <b>
      <Link
        to={linkTo || "/"}
        style={{
          fontSize: size,
          textDecoration: "none",
          color: isNonProd
            ? "red"
            : "#0053B3",
          display: "flex",
          alignItems: "center",
        }}
      >
        <img
          src={brandImgUrl}
          alt="ACM Logo"
          style={{ height: "3em", marginLeft: "1em", marginRight: "0.3em", marginTop: "0.3em", paddingRight: "0.5em" }}
        />
        {showText
          ? isNonProd && runEnv
            ? `Management Portal ${runEnv.toUpperCase().replace("LOCAL-DEV", "DEV")} ENV`
            : "Management Portal"
          : null}
      </Link>
    </b>
  );
};

export default LogoBadge;
